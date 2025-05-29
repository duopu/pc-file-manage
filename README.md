# 文件管理系统

基于Everything软件的本地文件管理Web应用，可以浏览、查看、删除和重命名电脑中的文件。

## 功能特点

- 基于Everything搜索引擎，快速搜索电脑中的文件
- 支持浏览文件系统的目录结构
- 支持查看文本文件内容
- 支持下载各类文件
- 支持文件删除和重命名操作
- 记录最近访问的文件
- 美观的用户界面

## 使用前提

1. 已安装Everything软件并开启HTTP服务
2. 同一局域网内可访问该服务

## 配置Everything

1. 打开Everything软件
2. 点击 `工具` -> `选项` -> `HTTP服务器`
3. 勾选 `启用HTTP服务器`
4. 设置端口（默认为80）
5. 点击确定保存配置

## 安装和运行

1. 克隆或下载此项目
2. 安装依赖：

```bash
npm install
```

3. 启动服务器：

```bash
npm start
```

4. 打开浏览器，访问 `http://localhost:3000`

## 配置说明

如果Everything使用了非默认设置，请修改 `src/index.js` 文件中的以下配置：

```javascript
// Everything服务的默认配置（可根据实际情况修改）
const EVERYTHING_HOST = 'localhost';
const EVERYTHING_PORT = 80;
```

## 使用说明

- 侧边栏提供快捷导航到常用文件夹
- 文件列表显示当前目录内容，双击文件夹进入，双击文件查看
- 搜索框可快速查找文件
- 每个文件右侧的操作按钮提供查看、重命名和删除功能
- 支持查看文本文件内容，非文本文件可下载后查看

## 技术栈

- 前端：HTML5, CSS3, JavaScript, Bootstrap 5
- 后端：Node.js, Express
- 数据源：Everything HTTP API

## 注意事项

- 该应用仅在同一局域网内可用
- 文件操作需要相应的系统权限
- 大文件可能需要较长的加载时间