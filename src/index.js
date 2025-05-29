const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const multer = require('multer');
const { exec } = require('child_process');

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
    const videoFileExts = ['.mp4', '.webm', '.ogg', '.mov'];
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

    // 使用fs.unlink删除文件
    await promisify(fs.unlink)(filePath);
    res.json({ success: true, message: '文件已删除' });
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

// 捕获所有其他请求并返回首页
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../static/index.html'));
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器已启动，访问 http://localhost:${port}`);
});
