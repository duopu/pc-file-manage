const fs = require('fs')

const getFileNames = path => {
  // 使用readdir获取指定目录下的所有文件名
  return fs.readdirSync(path)
}

const getFileSuffix = (fileName, splitChar) => {
  // return fileName.replace(/\[c0e0.com\]/g, '')
  return fileName.replace(/r18ss.com@/g, '')
}

// 2. 定义目录
// const dirName = `G:\\newnew`
// const dirName = `C:\\Users\\j\\Desktop\\nodeRename\\dir`

// 3. 读取与改写
const files = getFileNames(dirName)
files.forEach((item, i) => {
  // 这里对旧名操作获取新名
  const newName = getFileSuffix(item, '-')
  // 使用rename方法进行重命名
  fs.rename(`${dirName}\\${item}`, `${dirName}\\${newName}`, (err) => {
    if (err) throw err
    console.log('重命名完成')
  })
})
