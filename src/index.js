const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const multer = require('multer');
const { exec } = require('child_process');
const trash = require('trash');
const { spawn } = require('child_process');

const app = express();
const port = 3000;

// Everything服务的默认配置（可根据实际情况修改）
const EVERYTHING_HOST = 'localhost';
const EVERYTHING_PORT = 80;
const EVERYTHING_BASE_URL = `http://${EVERYTHING_HOST}:${EVERYTHING_PORT}`;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../static')));

// 文件上传配置
const upload = multer({ dest: 'uploads/' });

// 获取所有磁盘驱动器
app.get('/api/drives', (req, res) => {
  exec('wmic logicaldisk get caption', (error, stdout, stderr) => {
    if (error) {
      console.error('获取磁盘驱动器失败:', error);
      return res.status(500).json({ error: '获取磁盘驱动器失败', details: error.message });
    }

    // 解析输出结果
    const drives = stdout.split('\r\r\n')
      .map(line => line.trim())
      .filter(line => /^[A-Z]:$/.test(line))
      .map(drive => ({
        name: drive,
        path: drive
      }));

    res.json({ drives });
  });
});

// 将Everything的搜索结果转发给前端
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const response = await axios.get(`${EVERYTHING_BASE_URL}/ES`, {
      params: {
        s: query,
        json: 1
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ error: '搜索失败', details: error.message });
  }
});

// 获取文件内容
app.get('/api/file/content', async (req, res) => {
  try {
    const filePath = req.query.path;
    console.log('请求文件内容:', filePath);

    if (!filePath) {
      return res.status(400).json({ error: '缺少文件路径' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('文件不存在:', filePath);
      return res.status(404).json({ error: '文件不存在' });
    }

    // 检查是否是文件夹
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: '不能读取文件夹内容' });
    }

    // 获取文件类型
    const ext = path.extname(filePath).toLowerCase();

    // 判断文件类型
    const textFileExts = ['.txt', '.js', '.html', '.css', '.json', '.md', '.log', '.xml', '.csv', '.py', '.java', '.c', '.cpp', '.h', '.ts', '.jsx', '.vue', '.ini', '.config'];
    const imageFileExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
    const videoFileExts = ['.mp4', '.webm', '.ogg', '.mov', '.ts'];
    const audioFileExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];

    // 检查文件类型
    const isTextFile = textFileExts.includes(ext);
    const isImageFile = imageFileExts.includes(ext);
    const isVideoFile = videoFileExts.includes(ext);
    const isAudioFile = audioFileExts.includes(ext);

    // 响应不同类型的文件
    if (isTextFile) {
      // 读取文本文件
      const data = await promisify(fs.readFile)(filePath, 'utf8');
      res.json({
        content: data,
        type: 'text',
        extension: ext.substring(1)
      });
    } else if (isImageFile || isVideoFile || isAudioFile) {
      // 对于媒体文件，返回文件类型和URL
      const fileType = isImageFile ? 'image' : (isVideoFile ? 'video' : 'audio');
      const mimeType = getMimeType(ext);

      // 创建一个唯一的令牌来标识此次请求
      const token = Date.now().toString(36) + Math.random().toString(36).substring(2);

      // 为文件创建一个临时访问令牌
      const mediaToken = {
        path: filePath,
        token: token,
        expires: Date.now() + 3600000 // 1小时后过期
      };

      // 将令牌存储在服务器内存中
      if (!global.mediaTokens) {
        global.mediaTokens = [];
      }
      global.mediaTokens.push(mediaToken);

      // 清理过期的令牌
      global.mediaTokens = global.mediaTokens.filter(t => t.expires > Date.now());

      // 创建临时URL路径，使用令牌而不是文件路径
      const urlPath = `/media/${token}`;

      res.json({
        type: fileType,
        url: urlPath,
        mimeType: mimeType,
        extension: ext.substring(1)
      });
    } else {
      // 其他类型文件，提供下载
      res.json({
        type: 'other',
        extension: ext.substring(1),
        downloadUrl: `/api/file/download?path=${encodeURIComponent(filePath)}`
      });
    }
  } catch (error) {
    console.error('读取文件失败:', error);
    res.status(500).json({ error: '读取文件失败', details: error.message });
  }
});

// 文件下载
app.get('/api/file/download', (req, res) => {
  try {
    const filePath = req.query.path;
    console.log('请求下载文件:', filePath);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send('文件不存在');
    }

    // 获取文件名
    const fileName = path.basename(filePath);

    // 设置响应头，指定文件名
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

    // 发送文件
    res.sendFile(filePath);
  } catch (error) {
    console.error('文件下载失败:', error);
    res.status(500).send('文件下载失败: ' + error.message);
  }
});

// 媒体文件流式传输
app.get('/media/:token', (req, res) => {
  try {
    const token = req.params.token;
    console.log('收到媒体请求，令牌:', token);

    // 查找对应的媒体文件令牌
    if (!global.mediaTokens) {
      console.error('媒体令牌存储不存在');
      return res.status(404).send('找不到媒体文件');
    }

    const mediaToken = global.mediaTokens.find(t => t.token === token);
    if (!mediaToken) {
      console.error('找不到对应的媒体令牌:', token);
      console.log('当前有效令牌数量:', global.mediaTokens.length);
      return res.status(404).send('媒体文件令牌无效或已过期');
    }

    const filePath = mediaToken.path;
    console.log('通过令牌请求媒体文件:', filePath);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('媒体文件不存在:', filePath);
      return res.status(404).send('文件不存在');
    }

    // 获取文件类型
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = getMimeType(ext);

    // 设置响应头
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // 对于图片和小文件，直接发送文件
    if (ext.match(/\.(jpg|jpeg|png|gif|bmp|ico|svg|webp)$/i)) {
      console.log('发送图片文件:', filePath);
      return res.sendFile(path.resolve(filePath));
    }

    // 对于视频和音频，使用流式传输
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // 处理范围请求（对视频流很重要）
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      console.log(`处理范围请求: ${start}-${end}/${fileSize}`);

      const fileStream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      fileStream.pipe(res);

      // 处理流错误
      fileStream.on('error', (err) => {
        console.error('文件流错误:', err);
        if (!res.headersSent) {
          res.status(500).send('文件读取错误: ' + err.message);
        }
      });
    } else {
      // 非范围请求
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // 处理流错误
      fileStream.on('error', (err) => {
        console.error('文件流错误:', err);
        if (!res.headersSent) {
          res.status(500).send('文件读取错误: ' + err.message);
        }
      });
    }
  } catch (error) {
    console.error('媒体文件传输失败:', error);
    res.status(500).send('媒体文件传输失败: ' + error.message);
  }
});

// 获取MIME类型
function getMimeType(extension) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'application/ogg',
    '.mov': 'video/quicktime',
    '.ts': 'video/mp2t',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/m4a',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac'
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

// 删除文件
app.delete('/api/file', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: '缺少文件路径' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 使用trash库将文件移动到回收站
    await trash([filePath]);
    res.json({ success: true, message: '文件已移至回收站' });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({ error: '删除文件失败', details: error.message });
  }
});

// 重命名文件
app.put('/api/file/rename', async (req, res) => {
  try {
    const { oldPath, newName } = req.body;
    if (!oldPath || !newName) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(oldPath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 构建新路径
    const dirPath = path.dirname(oldPath);
    const newPath = path.join(dirPath, newName);

    // 检查新名称是否已存在
    if (fs.existsSync(newPath)) {
      return res.status(400).json({ error: '目标文件名已存在' });
    }

    // 重命名文件
    await promisify(fs.rename)(oldPath, newPath);
    res.json({ success: true, message: '文件已重命名', newPath });
  } catch (error) {
    console.error('重命名文件失败:', error);
    res.status(500).json({ error: '重命名文件失败', details: error.message });
  }
});

// 获取文件夹内容
app.get('/api/folder', async (req, res) => {
  try {
    let folderPath = req.query.path || '';
    console.log('请求访问文件夹:', folderPath);

    // 确保路径使用正确的分隔符（Windows上）
    folderPath = folderPath.replace(/\//g, '\\');

    // 检查文件夹是否存在
    if (!fs.existsSync(folderPath)) {
      console.error('文件夹不存在:', folderPath);
      return res.status(404).json({ error: '文件夹不存在' });
    }

    // 检查是否是文件夹
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      console.error('指定路径不是文件夹:', folderPath);
      return res.status(400).json({ error: '指定路径不是文件夹' });
    }

    // 读取文件夹内容
    const files = await promisify(fs.readdir)(folderPath);
    console.log(`读取到 ${files.length} 个文件/文件夹`);

    // 获取每个文件/文件夹的详细信息
    const fileDetails = await Promise.all(files.map(async (file) => {
      try {
        const filePath = path.join(folderPath, file);
        const stat = await promisify(fs.stat)(filePath);
        return {
          name: file,
          path: filePath.replace(/\\/g, '/'), // 转换为前端使用的路径格式
          isDirectory: stat.isDirectory(),
          size: stat.size,
          modifiedTime: stat.mtime
        };
      } catch (error) {
        // 如果无法访问文件，返回有限的信息
        console.warn(`无法访问文件 ${file} 的详细信息:`, error.message);
        return {
          name: file,
          path: path.join(folderPath, file).replace(/\\/g, '/'),
          isDirectory: false,
          size: 0,
          modifiedTime: new Date(),
          accessError: true
        };
      }
    }));

    res.json({ files: fileDetails });
  } catch (error) {
    console.error('读取文件夹失败:', error);
    res.status(500).json({ error: '读取文件夹失败', details: error.message });
  }
});

// 获取文件详细信息
app.get('/api/file/details', async (req, res) => {
  try {
    const filePath = req.query.path;
    console.log('请求文件详细信息:', filePath);

    if (!filePath) {
      return res.status(400).json({ error: '缺少文件路径' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('文件不存在:', filePath);
      return res.status(404).json({ error: '文件不存在' });
    }

    // 获取基本文件信息
    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch (statError) {
      console.error('获取文件状态失败:', statError);
      return res.status(500).json({
        error: '获取文件状态失败',
        details: statError.message
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    const fileType = getFileType(ext);

    // 基本文件信息
    const fileInfo = {
      name: fileName,
      path: filePath,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      type: fileType,
      extension: ext.substring(1)
    };

    // 对于媒体文件，尝试获取额外信息
    if (isMediaFile(ext)) {
      try {
        const mediaInfo = await getMediaFileInfo(filePath);
        Object.assign(fileInfo, mediaInfo);
      } catch (mediaError) {
        console.error('获取媒体信息失败:', mediaError);
        fileInfo.mediaError = mediaError.message;
      }
    }

    res.json(fileInfo);
  } catch (error) {
    console.error('获取文件详细信息失败:', error);
    // 确保不会因为错误而导致服务器崩溃
    res.status(500).json({
      error: '获取文件详细信息失败',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + units[i];
}

// 判断文件类型
function getFileType(ext) {
  const textFileExts = ['.txt', '.js', '.html', '.css', '.json', '.md', '.log', '.xml', '.csv', '.py', '.java', '.c', '.cpp', '.h', '.ts', '.jsx', '.vue', '.ini', '.config'];
  const imageFileExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
  const videoFileExts = ['.mp4', '.webm', '.ogg', '.mov', '.ts'];
  const audioFileExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
  const archiveFileExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'];
  const docFileExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

  if (textFileExts.includes(ext)) return '文本文件';
  if (imageFileExts.includes(ext)) return '图片文件';
  if (videoFileExts.includes(ext)) return '视频文件';
  if (audioFileExts.includes(ext)) return '音频文件';
  if (archiveFileExts.includes(ext)) return '压缩文件';
  if (docFileExts.includes(ext)) return '文档文件';

  return '未知类型';
}

// 判断是否是媒体文件
function isMediaFile(ext) {
  const mediaFileExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
                         '.mp4', '.webm', '.ogg', '.mov', '.ts',
                         '.mp3', '.wav', '.m4a', '.aac', '.flac'];
  return mediaFileExts.includes(ext);
}

// 获取媒体文件信息
async function getMediaFileInfo(filePath) {
  return new Promise((resolve) => {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return resolve({
          mediaInfo: '文件不存在或无法访问'
        });
      }

      // 获取文件扩展名
      const ext = path.extname(filePath).toLowerCase();

      // 尝试使用ffprobe获取媒体文件信息
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ]);

      let output = '';
      let errorOutput = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // 设置超时处理
      const timeout = setTimeout(() => {
        try {
          ffprobe.kill();
        } catch (e) {
          console.error('终止ffprobe进程失败:', e);
        }
        // 尝试使用备用方法
        getBasicMediaInfo(filePath, ext).then(info => resolve(info));
      }, 5000); // 5秒超时

      ffprobe.on('error', (err) => {
        clearTimeout(timeout);
        console.warn('ffprobe命令执行失败:', err.message);
        // 尝试使用备用方法
        getBasicMediaInfo(filePath, ext).then(info => resolve(info));
      });

      ffprobe.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          console.warn('ffprobe命令失败，返回基本信息:', errorOutput);
          // 尝试使用备用方法
          getBasicMediaInfo(filePath, ext).then(info => resolve(info));
          return;
        }

        try {
          const info = JSON.parse(output);
          const mediaInfo = {
            format: info.format,
            duration: info.format.duration ? `${parseFloat(info.format.duration).toFixed(2)}秒` : '未知',
            bitrate: info.format.bit_rate ? `${Math.round(info.format.bit_rate / 1000)} Kbps` : '未知'
          };

          // 处理视频流信息
          const videoStream = info.streams.find(s => s.codec_type === 'video');
          if (videoStream) {
            mediaInfo.video = {
              codec: videoStream.codec_name,
              resolution: `${videoStream.width}x${videoStream.height}`,
              aspectRatio: videoStream.display_aspect_ratio || '未知',
              frameRate: videoStream.r_frame_rate ? eval(videoStream.r_frame_rate).toFixed(2) : '未知',
              bitrate: videoStream.bit_rate ? `${Math.round(videoStream.bit_rate / 1000)} Kbps` : '未知'
            };
          }

          // 处理音频流信息
          const audioStream = info.streams.find(s => s.codec_type === 'audio');
          if (audioStream) {
            mediaInfo.audio = {
              codec: audioStream.codec_name,
              sampleRate: audioStream.sample_rate ? `${audioStream.sample_rate} Hz` : '未知',
              channels: audioStream.channels || '未知',
              bitrate: audioStream.bit_rate ? `${Math.round(audioStream.bit_rate / 1000)} Kbps` : '未知'
            };
          }

          resolve(mediaInfo);
        } catch (error) {
          console.error('解析媒体信息失败:', error);
          // 尝试使用备用方法
          getBasicMediaInfo(filePath, ext).then(info => resolve(info));
        }
      });
    } catch (error) {
      console.error('获取媒体信息时发生异常:', error);
      // 尝试使用备用方法
      getBasicMediaInfo(filePath, path.extname(filePath).toLowerCase()).then(info => resolve(info));
    }
  });
}

// 使用Node.js原生方法获取基本媒体信息
async function getBasicMediaInfo(filePath, ext) {
  try {
    const stats = fs.statSync(filePath);
    const mediaInfo = {
      mediaInfo: 'FFmpeg未安装或不可用，只能显示基本信息'
    };

    // 对于图片文件，尝试读取文件头来获取更多信息
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
      try {
        // 读取文件的前50个字节来检查图片类型和尺寸
        const buffer = Buffer.alloc(50);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 50, 0);
        fs.closeSync(fd);

        // 检查PNG图片
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
          // PNG图片: 宽度在16-19字节，高度在20-23字节
          const width = buffer.readUInt32BE(16);
          const height = buffer.readUInt32BE(20);
          mediaInfo.format = { format_name: 'PNG' };
          mediaInfo.video = {
            codec: 'png',
            resolution: `${width}x${height}`,
            aspectRatio: width && height ? (width / height).toFixed(2) : '未知'
          };
        }
        // 检查JPEG图片
        else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
          mediaInfo.format = { format_name: 'JPEG' };
        }
        // 检查GIF图片
        else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
          // GIF图片: 宽度在6-7字节，高度在8-9字节
          const width = buffer.readUInt16LE(6);
          const height = buffer.readUInt16LE(8);
          mediaInfo.format = { format_name: 'GIF' };
          mediaInfo.video = {
            codec: 'gif',
            resolution: `${width}x${height}`,
            aspectRatio: width && height ? (width / height).toFixed(2) : '未知'
          };
        }
        // 检查BMP图片
        else if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
          // BMP图片: 宽度在18-21字节，高度在22-25字节
          const width = buffer.readInt32LE(18);
          const height = buffer.readInt32LE(22);
          mediaInfo.format = { format_name: 'BMP' };
          mediaInfo.video = {
            codec: 'bmp',
            resolution: `${width}x${height}`,
            aspectRatio: width && height ? (width / height).toFixed(2) : '未知'
          };
        }
      } catch (imgError) {
        console.error('读取图片信息失败:', imgError);
      }
    }

    return mediaInfo;
  } catch (error) {
    console.error('获取基本媒体信息失败:', error);
    return {
      mediaInfo: '无法获取媒体信息'
    };
  }
}

// 捕获所有其他请求并返回首页
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../static/index.html'));
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器已启动，访问 http://localhost:${port}`);
});
