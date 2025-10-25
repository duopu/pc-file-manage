const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DuplicateFileFinder {
    constructor() {
        this.fileMap = new Map(); // 存储文件名对应的文件信息
        this.duplicates = new Map(); // 存储同名文件
        this.stats = {
            totalFiles: 0,
            totalDirectories: 0,
            duplicateGroups: 0,
            totalDuplicates: 0
        };
    }

    /**
     * 递归扫描目录
     * @param {string} dirPath - 目录路径
     */
    async scanDirectory(dirPath) {
        try {
            const items = await fs.promises.readdir(dirPath);

            for (const item of items) {
                const fullPath = path.join(dirPath, item);

                try {
                    const stat = await fs.promises.stat(fullPath);

                    if (stat.isDirectory()) {
                        this.stats.totalDirectories++;
                        await this.scanDirectory(fullPath); // 递归扫描子目录
                    } else if (stat.isFile()) {
                        this.stats.totalFiles++;
                        await this.processFile(fullPath, stat);
                    }
                } catch (error) {
                    console.warn(`无法访问: ${fullPath} - ${error.message}`);
                }
            }
        } catch (error) {
            console.error(`扫描目录失败: ${dirPath} - ${error.message}`);
        }
    }

    /**
     * 处理单个文件
     * @param {string} filePath - 文件路径
     * @param {fs.Stats} stat - 文件统计信息
     */
    async processFile(filePath, stat) {
        const fileName = path.basename(filePath);
        const fileExt = path.extname(filePath).toLowerCase();
        const fileSize = stat.size;
        const modifiedTime = stat.mtime;

        // 获取文件的MD5哈希值（用于区分内容相同的文件）
        let fileHash = '';
        try {
            const fileBuffer = await fs.promises.readFile(filePath);
            fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        } catch (error) {
            console.warn(`无法读取文件哈希: ${filePath}`);
        }

        const fileInfo = {
            name: fileName,
            path: filePath,
            directory: path.dirname(filePath),
            extension: fileExt,
            size: fileSize,
            sizeFormatted: this.formatFileSize(fileSize),
            modifiedTime: modifiedTime,
            modifiedTimeFormatted: modifiedTime.toLocaleString('zh-CN'),
            hash: fileHash
        };

        // 检查是否已存在同名文件
        if (this.fileMap.has(fileName)) {
            // 如果已存在，添加到重复文件列表
            if (!this.duplicates.has(fileName)) {
                this.duplicates.set(fileName, [this.fileMap.get(fileName)]);
            }
            this.duplicates.get(fileName).push(fileInfo);
        } else {
            // 首次遇到该文件名
            this.fileMap.set(fileName, fileInfo);
        }
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取文件类型图标
     * @param {string} extension - 文件扩展名
     * @returns {string} 图标类名或emoji
     */
    getFileIcon(extension) {
        const iconMap = {
            // 图片
            '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️',
            '.bmp': '🖼️', '.svg': '🖼️', '.webp': '🖼️', '.ico': '🖼️',
            // 视频
            '.mp4': '🎬', '.avi': '🎬', '.mov': '🎬', '.wmv': '🎬',
            '.flv': '🎬', '.mkv': '🎬', '.webm': '🎬', '.m4v': '🎬',
            // 音频
            '.mp3': '🎵', '.wav': '🎵', '.flac': '🎵', '.aac': '🎵',
            '.ogg': '🎵', '.wma': '🎵', '.m4a': '🎵',
            // 文档
            '.pdf': '📄', '.doc': '📝', '.docx': '📝', '.txt': '📄',
            '.rtf': '📝', '.odt': '📝',
            // 表格
            '.xls': '📊', '.xlsx': '📊', '.csv': '📊', '.ods': '📊',
            // 演示文稿
            '.ppt': '📊', '.pptx': '📊', '.odp': '📊',
            // 压缩文件
            '.zip': '📦', '.rar': '📦', '.7z': '📦', '.tar': '📦',
            '.gz': '📦', '.bz2': '📦',
            // 代码文件
            '.js': '💻', '.html': '💻', '.css': '💻', '.py': '💻',
            '.java': '💻', '.cpp': '💻', '.c': '💻', '.php': '💻'
        };

        return iconMap[extension] || '📄';
    }
 /**
     * 生成HTML报告
     * @param {string} outputPath - 输出HTML文件路径
     */
    async generateHTMLReport(outputPath) {
        // 计算统计信息
        this.stats.duplicateGroups = this.duplicates.size;
        this.stats.totalDuplicates = Array.from(this.duplicates.values())
            .reduce((total, group) => total + group.length, 0);

        const htmlContent = this.generateHTMLContent();

        try {
            await fs.promises.writeFile(outputPath, htmlContent, 'utf8');
            console.log(`HTML报告已生成: ${outputPath}`);
        } catch (error) {
            console.error(`生成HTML报告失败: ${error.message}`);
        }
    }

    /**
     * 生成HTML内容
     * @returns {string} HTML内容
     */
    generateHTMLContent() {
        const duplicateGroupsHTML = Array.from(this.duplicates.entries())
            .map(([fileName, files]) => this.generateDuplicateGroupHTML(fileName, files))
            .join('');

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>重复文件检测报告</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }

        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-5px);
        }

        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #4facfe;
            margin-bottom: 5px;
        }

        .stat-label {
            color: #666;
            font-size: 0.9em;
        }

        .content {
            padding: 30px;
        }

        .duplicate-group {
            margin-bottom: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        .group-header {
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
            padding: 15px 20px;
            color: #333;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .file-count {
            background: rgba(255,255,255,0.3);
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.9em;
        }

        .file-list {
            background: white;
        }

        .file-item {
            padding: 15px 20px;
            border-bottom: 1px solid #f0f0f0;
            display: grid;
            grid-template-columns: auto 1fr auto auto auto;
            gap: 15px;
            align-items: center;
            transition: background-color 0.3s ease;
        }

        .file-item:hover {
            background-color: #f8f9fa;
        }

        .file-item:last-child {
            border-bottom: none;
        }

        .file-icon {
            font-size: 1.5em;
        }

        .file-info {
            display: flex;
            flex-direction: column;
        }

        .file-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        .file-path {
            color: #666;
            font-size: 0.9em;
            word-break: break-all;
        }

        .file-size {
            color: #4facfe;
            font-weight: bold;
        }

        .file-date {
            color: #666;
            font-size: 0.9em;
        }

        .file-hash {
            font-family: monospace;
            font-size: 0.8em;
            color: #999;
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .no-duplicates {
            text-align: center;
            padding: 50px;
            color: #666;
        }

        .no-duplicates h2 {
            color: #4facfe;
            margin-bottom: 10px;
        }

        @media (max-width: 768px) {
            .file-item {
                grid-template-columns: auto 1fr;
                gap: 10px;
            }

            .file-size, .file-date, .file-hash {
                grid-column: 1 / -1;
                margin-left: 40px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 重复文件检测报告</h1>
            <p>扫描结果统计与详细信息</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${this.stats.totalFiles}</div>
                <div class="stat-label">总文件数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.totalDirectories}</div>
                <div class="stat-label">总目录数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.duplicateGroups}</div>
                <div class="stat-label">重复文件组</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.totalDuplicates}</div>
                <div class="stat-label">重复文件总数</div>
            </div>
        </div>

        <div class="content">
            ${this.stats.duplicateGroups > 0 ? duplicateGroupsHTML : `
                <div class="no-duplicates">
                    <h2>🎉 恭喜！</h2>
                    <p>未发现重复文件，您的文件夹很整洁！</p>
                </div>
            `}
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * 生成重复文件组的HTML
     * @param {string} fileName - 文件名
     * @param {Array} files - 文件列表
     * @returns {string} HTML内容
     */
    generateDuplicateGroupHTML(fileName, files) {
        const filesHTML = files.map(file => `
            <div class="file-item">
                <div class="file-icon">${this.getFileIcon(file.extension)}</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-path">${file.path}</div>
                </div>
                <div class="file-size">${file.sizeFormatted}</div>
                <div class="file-date">${file.modifiedTimeFormatted}</div>
                <div class="file-hash" title="${file.hash}">${file.hash.substring(0, 8)}...</div>
            </div>
        `).join('');

        return `
            <div class="duplicate-group">
                <div class="group-header">
                    <span>📁 ${fileName}</span>
                    <div class="file-count">${files.length} 个重复文件</div>
                </div>
                <div class="file-list">
                    ${filesHTML}
                </div>
            </div>
        `;
    }

    /**
     * 主执行函数
     * @param {string} targetDirectory - 要扫描的目录
     * @param {string} outputPath - 输出HTML文件路径
     */
    async run(targetDirectory, outputPath = './duplicate-files-report.html') {
        console.log(`开始扫描目录: ${targetDirectory}`);
        console.log('正在扫描文件...');

        const startTime = Date.now();

        try {
            // 检查目标目录是否存在
            await fs.promises.access(targetDirectory);

            // 扫描目录
            await this.scanDirectory(targetDirectory);

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            console.log(`\n扫描完成！耗时: ${duration}秒`);
            console.log(`总文件数: ${this.stats.totalFiles}`);
            console.log(`总目录数: ${this.stats.totalDirectories}`);
            console.log(`发现 ${this.stats.duplicateGroups} 组重复文件，共 ${this.stats.totalDuplicates} 个重复文件`);

            // 生成HTML报告
            await this.generateHTMLReport(outputPath);

        } catch (error) {
            console.error(`执行失败: ${error.message}`);
        }
    }
}

// 使用示例
async function main() {
    const { exec } = require('child_process');
    const finder = new DuplicateFileFinder();

    // 默认扫描路径（可以根据需要修改这个路径）
    const defaultDirectory = 'C:\\Users\\jiang\\Desktop\\test-folder';

    // 从命令行参数获取目标目录，如果没有提供则使用默认路径
    const targetDirectory = process.argv[2] || defaultDirectory;

    // 确保输出目录存在，报告文件生成在find-same-name文件夹下
    const outputDir = __dirname;
    const outputPath = path.join(outputDir, 'duplicate-files-report.html');

    console.log(`扫描目录: ${targetDirectory}`);
    console.log(`报告将生成到: ${outputPath}`);

    await finder.run(targetDirectory, outputPath);

    // 自动打开HTML报告文件
    console.log('\n正在打开报告文件...');
    const command = process.platform === 'win32' ? `start "" "${outputPath}"` :
                   process.platform === 'darwin' ? `open "${outputPath}"` :
                   `xdg-open "${outputPath}"`;

    exec(command, (error) => {
        if (error) {
            console.error('无法自动打开浏览器，请手动打开报告文件:', outputPath);
        } else {
            console.log('报告已在默认浏览器中打开！');
        }
    });
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
    main().catch(console.error);
}

module.exports = DuplicateFileFinder;