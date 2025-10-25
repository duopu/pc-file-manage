# 重复文件查找工具

这个工具可以递归扫描指定文件夹，查找所有同名文件，并生成美观的HTML报告。

## 功能特性

- 🔍 递归扫描所有子目录
- 📊 生成美观的HTML报告
- 🎨 响应式设计，支持移动设备
- 📁 按文件名分组显示重复文件
- 🔒 只读操作，不会修改任何文件
- 🌐 自动在浏览器中打开报告

## 使用方法

### 1. 使用npm命令（推荐）

```bash
# 使用默认路径扫描
npm run findSame

# 扫描指定路径
npm run findSame "C:\Users\jiang\Desktop\your-folder"
```

### 2. 直接运行Node.js文件

```bash
# 使用默认路径
node src/find-same-name/find-same-name.js

# 扫描指定路径
node src/find-same-name/find-same-name.js "C:\Users\jiang\Desktop\your-folder"
```

### 3. 在代码中使用

```javascript
const DuplicateFileFinder = require('./find-same-name');
const path = require('path');

async function findDuplicates() {
    const finder = new DuplicateFileFinder();
    const targetDirectory = 'C:\\your\\folder\\path';
    const outputPath = path.join(__dirname, 'report.html');

    await finder.run(targetDirectory, outputPath);
}

findDuplicates().catch(console.error);
```

## 配置默认路径

要修改默认扫描路径，请编辑 `find-same-name.js` 文件中的 `defaultDirectory` 变量：

```javascript
// 默认扫描路径（可以根据需要修改这个路径）
const defaultDirectory = 'C:\\Users\\jiang\\Desktop\\test-folder';
```

## 输出文件

- HTML报告会生成在 `src/find-same-name/` 目录下
- 文件名为 `duplicate-files-report.html`
- 报告生成后会自动在默认浏览器中打开

## 报告内容

HTML报告包含以下信息：

- 📈 扫描统计（总文件数、目录数、重复文件组数等）
- 📁 按文件名分组的重复文件列表
- 📄 每个文件的详细信息：
  - 文件路径
  - 文件大小
  - 修改时间
  - MD5哈希值（用于区分内容是否相同）
  - 文件类型图标

## 注意事项

- 工具只进行读取操作，不会修改、移动或删除任何文件
- 对于无权限访问的文件或目录，会跳过并显示警告
- 大文件夹扫描可能需要一些时间，请耐心等待
- 支持所有文件类型（图片、视频、文档等）