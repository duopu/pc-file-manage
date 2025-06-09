const fs = require('fs');
const path = require('path');


// 相对路径（例如，当前脚本所在目录下的 "my-folder" 文件夹）
const relativeDir = './tools'; // 也可以是 '../my-folder'
const resolvedPath = path.resolve(__dirname, relativeDir);


const absoluteDir = 'C:\\Users\\jiang\\Desktop\\DATA\\测试上传文件夹1'; // 注意：Windows 路径要用双斜杠或转义写法
console.log('绝对路径:', absoluteDir);

// === 配置区域：你可以改成你想要的目录和输出文件名 ===
const targetDir = path.resolve(__dirname, absoluteDir); // 替换为目标文件夹路径
const outputFilePath = path.resolve(__dirname, 'file-list.txt'); // 输出的txt文件路径

// ========================================================

// 递归获取所有文件路径
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

function main() {
  try {
    const allFiles = getAllFiles(targetDir);
    const content = allFiles.join('\n');
    fs.writeFileSync(outputFilePath, content, 'utf8');
    console.log(`文件列表已保存到：${outputFilePath}`);
  } catch (err) {
    console.error('出错了：', err);
  }
}

main();
