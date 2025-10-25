const DuplicateFileFinder = require('./find-same-name');
const path = require('path');

async function example() {
    const finder = new DuplicateFileFinder();

    // 示例：扫描指定文件夹
    const targetDirectory = 'C:\\Users\\jiang\\Desktop\\DATA\\测试上传文件夹1';

    // 输出HTML报告的路径（生成在当前目录下）
    const outputPath = path.join(__dirname, 'example-report.html');

    console.log('开始查找重复文件...');
    await finder.run(targetDirectory, outputPath);
    console.log('完成！请查看生成的HTML报告。');
}

// 使用说明
console.log(`
使用方法：
1. 使用npm命令（推荐）：
   npm run findSame                           # 使用默认路径
   npm run findSame "C:\\your\\folder\\path"   # 使用指定路径

2. 直接运行文件：
   node find-same-name.js                     # 使用默认路径
   node find-same-name.js "C:\\your\\path"    # 使用指定路径

3. 在代码中使用：
   见下面的example()函数示例
`);

// 如果直接运行此文件，则执行示例
if (require.main === module) {
    example().catch(console.error);
}
