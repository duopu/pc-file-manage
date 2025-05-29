// 全局变量
let currentPath = ""; // 默认不设置初始路径，等待加载驱动器
const MAX_RECENT_FILES = 5;

// 添加一个变量用于跟踪当前媒体请求
let currentMediaRequest = null;
// 添加变量用于跟踪图片加载状态
let imageLoadingInProgress = false;
// 添加变量用于跟踪触摸事件
let lastTapTime = 0;
let touchTimer = null;

// DOM 元素
const fileList = document.getElementById("fileList");
const fileTable = document.getElementById("fileTable");
const loadingIndicator = document.getElementById("loadingIndicator");
const pathBreadcrumb = document.getElementById("pathBreadcrumb");
const statusInfo = document.getElementById("statusInfo");
const currentPathDisplay = document.getElementById("currentPath");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const fileContentModal = new bootstrap.Modal(
  document.getElementById("fileContentModal")
);
const fileContentViewer = document.getElementById("fileContentViewer");
const fileContentModalLabel = document.getElementById("fileContentModalLabel");
const downloadFileBtn = document.getElementById("downloadFileBtn");
const renameModal = new bootstrap.Modal(document.getElementById("renameModal"));
const newFilenameInput = document.getElementById("newFilename");
const oldFilePathInput = document.getElementById("oldFilePath");
const confirmRenameBtn = document.getElementById("confirmRenameBtn");
const drivesList = document.getElementById("drivesList");
const imageViewer = document.getElementById("imageViewer");
const previewImage = document.getElementById("previewImage");
const videoPlayer = document.getElementById("videoPlayer");
const previewVideo = document.getElementById("previewVideo");
const audioPlayer = document.getElementById("audioPlayer");
const previewAudio = document.getElementById("previewAudio");
const unsupportedFileViewer = document.getElementById("unsupportedFileViewer");

// 媒体预览元素
const mediaPreviewOverlay = document.getElementById("mediaPreviewOverlay");
const mediaCloseBtn = document.getElementById("mediaCloseBtn");
const fullscreenImageViewer = document.getElementById("fullscreenImageViewer");
const fullscreenImage = document.getElementById("fullscreenImage");
const fullscreenVideoViewer = document.getElementById("fullscreenVideoViewer");
const fullscreenVideo = document.getElementById("fullscreenVideo");

// 响应式布局元素
const sidebar = document.getElementById("sidebar");
const toggleSidebarBtn = document.getElementById("toggleSidebar");
const mainContent = document.getElementById("mainContent");

// 移动端导航元素
const mobileNav = document.getElementById("mobileNav");
const showSidebarBtn = document.getElementById("showSidebarBtn");
const homeBtn = document.getElementById("homeBtn");
const searchMobileBtn = document.getElementById("searchMobileBtn");

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  // 加载磁盘驱动器
  loadDrives();

  // 绑定事件监听器
  bindEventListeners();

  // 绑定媒体预览关闭按钮事件
  mediaCloseBtn.addEventListener("click", closeMediaPreview);

  // 监听ESC键关闭媒体预览
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      !mediaPreviewOverlay.classList.contains("d-none")
    ) {
      closeMediaPreview();
    }
  });

  // 绑定侧边栏切换按钮
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener("click", toggleSidebar);
  }

  // 绑定移动端底部导航栏事件
  bindMobileNavEvents();

  // 创建侧边栏背景遮罩
  createSidebarBackdrop();

  // 监听窗口大小变化，调整布局
  window.addEventListener("resize", handleWindowResize);

  // 初始化时执行一次窗口大小检查
  handleWindowResize();
});

// 创建侧边栏背景遮罩
function createSidebarBackdrop() {
  const backdrop = document.createElement("div");
  backdrop.className = "sidebar-backdrop";
  backdrop.id = "sidebarBackdrop";
  backdrop.addEventListener("click", hideSidebar);
  document.body.appendChild(backdrop);
}

// 显示侧边栏
function showSidebar() {
  // 确保侧边栏元素存在
  if (!sidebar) return;

  console.log("显示侧边栏");

  // 设置侧边栏样式
  sidebar.style.left = "0";
  sidebar.classList.add("show");

  // 显示背景遮罩
  const backdrop = document.getElementById("sidebarBackdrop");
  if (backdrop) {
    backdrop.classList.add("show");
  }
}

// 隐藏侧边栏
function hideSidebar() {
  // 确保侧边栏元素存在
  if (!sidebar) return;

  console.log("隐藏侧边栏");

  // 设置侧边栏样式
  sidebar.style.left = "-100%";
  sidebar.classList.remove("show");

  // 隐藏背景遮罩
  const backdrop = document.getElementById("sidebarBackdrop");
  if (backdrop) {
    backdrop.classList.remove("show");
  }
}

// 切换侧边栏显示/隐藏
function toggleSidebar() {
  if (sidebar.classList.contains("show")) {
    hideSidebar();
  } else {
    showSidebar();
  }
}

// 处理窗口大小变化
function handleWindowResize() {
  // 在小屏幕上确保侧边栏正确隐藏
  if (window.innerWidth >= 768) {
    sidebar.style.left = "0";
    mainContent.style.marginLeft = "";
    document.getElementById("sidebarBackdrop").classList.remove("show");
  } else {
    if (!sidebar.classList.contains("show")) {
      sidebar.style.left = "-100%";
    }
  }

  // 调整面包屑导航的可见性
  adjustBreadcrumbVisibility();
}

// 调整面包屑导航的可见性
function adjustBreadcrumbVisibility() {
  // 确保面包屑导航在移动设备上可以滚动查看
  if (pathBreadcrumb.scrollWidth > pathBreadcrumb.clientWidth) {
    pathBreadcrumb.classList.add("has-overflow");
  } else {
    pathBreadcrumb.classList.remove("has-overflow");
  }
}

// 关闭媒体预览
function closeMediaPreview() {
  // 如果有正在进行的请求，中止它
  if (currentMediaRequest && currentMediaRequest.abort) {
    currentMediaRequest.abort();
  }

  // 标记图片不在加载中
  imageLoadingInProgress = false;

  // 清除视频源，停止所有资源加载
  fullscreenVideo.pause();
  fullscreenVideo.removeAttribute("src");
  fullscreenVideo.load();

  // 清除图片源前先移除事件监听器
  fullscreenImage.onload = null;
  fullscreenImage.onerror = null;
  fullscreenImage.src = "";

  // 隐藏预览界面
  mediaPreviewOverlay.classList.add("d-none");
  fullscreenImageViewer.classList.add("d-none");
  fullscreenVideoViewer.classList.add("d-none");
}

// 加载磁盘驱动器
async function loadDrives() {
  try {
    const response = await fetch("/api/drives");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 清空驱动器列表
    drivesList.innerHTML = "";

    if (data.drives && data.drives.length > 0) {
      // 添加所有驱动器
      data.drives.forEach((drive) => {
        const li = document.createElement("li");
        li.className =
          "list-group-item list-group-item-action d-flex align-items-center";
        li.dataset.path = drive.path;
        li.innerHTML = `<i class="bi bi-hdd me-2"></i> ${drive.name}`;

        li.addEventListener("click", () => {
          loadFolder(drive.path);
        });

        drivesList.appendChild(li);
      });

      // 默认加载第一个驱动器
      if (!currentPath) {
        currentPath = data.drives[0].path;
        updatePathDisplay(currentPath);
        loadFolder(currentPath);
      }
    } else {
      // 没有找到驱动器
      const li = document.createElement("li");
      li.className = "list-group-item text-muted";
      li.textContent = "未找到磁盘驱动器";
      drivesList.appendChild(li);
    }
  } catch (error) {
    console.error("加载磁盘驱动器失败:", error);
    drivesList.innerHTML = `
            <li class="list-group-item text-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                加载失败: ${error.message}
            </li>
            <li class="list-group-item list-group-item-action d-flex align-items-center" data-path="C:">
                <i class="bi bi-hdd me-2"></i> C:
            </li>
        `;

    // 添加点击事件
    drivesList.querySelector("[data-path]").addEventListener("click", (e) => {
      loadFolder(e.currentTarget.dataset.path);
    });

    // 如果没有设置当前路径，默认设置为C:
    if (!currentPath) {
      currentPath = "C:";
      updatePathDisplay(currentPath);
      loadFolder(currentPath);
    }
  }
}

// 更新路径显示
function updatePathDisplay(path) {
  currentPathDisplay.textContent = `当前路径: ${path}`;
  updateBreadcrumb(path);
}

// 绑定事件监听器
function bindEventListeners() {
  // 快捷导航点击事件
  document
    .querySelectorAll(".shortcut-list .list-group-item")
    .forEach((item) => {
      item.addEventListener("click", (e) => {
        const path = e.currentTarget.dataset.path;
        loadFolder(path);
      });
    });

  // 搜索按钮点击事件
  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
      searchFiles(query);
    }
  });

  // 搜索输入框回车事件
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        searchFiles(query);
      }
    }
  });

  // 重命名确认按钮
  confirmRenameBtn.addEventListener("click", () => {
    const oldPath = oldFilePathInput.value;
    const newName = newFilenameInput.value.trim();

    if (newName && oldPath) {
      renameFile(oldPath, newName);
    }
  });
}

// 加载文件夹内容
async function loadFolder(path) {
  try {
    // 显示加载指示器
    fileTable.style.display = "none";
    loadingIndicator.style.display = "flex";

    // 发送请求获取文件夹内容
    const response = await fetch(
      `/api/folder?path=${encodeURIComponent(path)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 更新当前路径
    currentPath = path;
    updatePathDisplay(currentPath);

    // 清空文件列表
    fileList.innerHTML = "";

    // 如果不是根驱动器，添加"返回上一级"项
    if (path.length > 3) {
      // 例如 "C:/" 长度为3
      const parentPath = getParentPath(path);
      const parentRow = createFileRow({
        name: "..",
        path: parentPath,
        isDirectory: true,
        size: 0,
        modifiedTime: new Date(),
        isParent: true,
      });
      fileList.appendChild(parentRow);
    }

    // 排序文件列表：文件夹在前，文件在后，按字母顺序排序
    const sortedFiles = data.files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    // 添加文件和文件夹到列表
    sortedFiles.forEach((file) => {
      const row = createFileRow(file);
      fileList.appendChild(row);
    });

    // 更新状态信息
    statusInfo.textContent = `${data.files.length} 个项目`;

    // 隐藏加载指示器，显示文件表格
    loadingIndicator.style.display = "none";
    fileTable.style.display = "table";
  } catch (error) {
    console.error("加载文件夹失败:", error);

    // 显示友好的错误信息
    fileList.innerHTML = "";
    const errorRow = document.createElement("tr");
    const errorCell = document.createElement("td");
    errorCell.colSpan = 5;
    errorCell.className = "text-center p-5 text-danger";
    errorCell.innerHTML = `
            <i class="bi bi-exclamation-circle fs-1 d-block mb-3"></i>
            <h5>访问文件夹失败</h5>
            <p>${error.message}</p>
            <p class="text-muted small">这可能是由于权限不足或路径不存在</p>
            <button class="btn btn-outline-primary mt-2" id="backBtn">
                <i class="bi bi-arrow-left"></i> 返回上一级
            </button>
        `;
    errorRow.appendChild(errorCell);
    fileList.appendChild(errorRow);

    // 添加返回按钮事件
    document.getElementById("backBtn").addEventListener("click", () => {
      // 尝试返回上一级，如果是根目录则加载驱动器列表
      if (path.length > 3) {
        loadFolder(getParentPath(path));
      } else {
        // 如果是根目录，尝试重新加载驱动器
        loadDrives();
      }
    });

    // 隐藏加载指示器，显示文件表格
    loadingIndicator.style.display = "none";
    fileTable.style.display = "table";
  }
}

// 创建文件行
function createFileRow(file) {
  const row = document.createElement("tr");

  // 设置单击事件（替换原来的双击事件）
  if (!file.isParent) {
    row.addEventListener("click", () => {
      if (file.isDirectory) {
        loadFolder(file.path);
      } else {
        viewFile(file);
      }
    });

    // 添加触摸事件处理，防止在移动设备上双击缩放
    row.addEventListener("touchstart", (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;

      clearTimeout(touchTimer);

      if (tapLength < 500 && tapLength > 0) {
        // 双击事件
        e.preventDefault(); // 阻止默认行为，防止缩放
        if (file.isDirectory) {
          loadFolder(file.path);
        } else {
          viewFile(file);
        }
      } else {
        // 单击事件处理
        touchTimer = setTimeout(() => {
          // 单击操作可以在这里处理
        }, 300);
      }
      lastTapTime = currentTime;
    });
  } else {
    row.addEventListener("click", () => {
      loadFolder(file.path);
    });

    // 添加触摸事件处理，防止在移动设备上双击缩放
    row.addEventListener("touchstart", (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;

      clearTimeout(touchTimer);

      if (tapLength < 500 && tapLength > 0) {
        // 双击事件
        e.preventDefault(); // 阻止默认行为，防止缩放
        loadFolder(file.path);
      } else {
        // 单击事件处理
        touchTimer = setTimeout(() => {
          // 单击操作可以在这里处理
        }, 300);
      }
      lastTapTime = currentTime;
    });
  }

  // 文件图标
  const iconCell = document.createElement("td");
  const icon = document.createElement("i");
  icon.className = `bi file-icon ${getFileIconClass(file)}`;
  iconCell.appendChild(icon);
  row.appendChild(iconCell);

  // 文件名
  const nameCell = document.createElement("td");
  nameCell.textContent = file.name;
  nameCell.classList.add("text-truncate"); // 添加截断样式
  row.appendChild(nameCell);

  // 文件大小
  const sizeCell = document.createElement("td");
  sizeCell.textContent = file.isDirectory ? "" : formatFileSize(file.size);
  sizeCell.classList.add("d-none", "d-md-table-cell"); // 在移动设备上隐藏
  row.appendChild(sizeCell);

  // 修改日期
  const dateCell = document.createElement("td");
  dateCell.textContent = file.isParent
    ? ""
    : formatDate(new Date(file.modifiedTime));
  dateCell.classList.add("d-none", "d-md-table-cell"); // 在移动设备上隐藏
  row.appendChild(dateCell);

  // 操作按钮
  const actionsCell = document.createElement("td");

  if (!file.isParent) {
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "action-icons d-flex gap-2";

    // 判断文件类型
    const ext = file.name.split(".").pop().toLowerCase();
    const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
    const videoExts = ["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv"];

    const isImage = imageExts.includes(ext);
    const isVideo = videoExts.includes(ext);

    // 复制按钮 (仅对图片和视频文件显示)
    if (isImage || isVideo) {
      const copyBtn = createActionButton("复制文件名", "bi-clipboard", () => {
        navigator.clipboard
          .writeText(file.name)
          .then(() => {
            console.warn("文件名已复制到剪贴板");
            // 显示一个临时提示
            const toast = document.createElement("div");
            toast.className = "toast-notification";
            toast.textContent = "文件名已复制";
            document.body.appendChild(toast);
            setTimeout(() => {
              toast.classList.add("show");
              setTimeout(() => {
                toast.classList.remove("show");
                setTimeout(() => {
                  document.body.removeChild(toast);
                }, 300);
              }, 2000);
            }, 10);
          })
          .catch((err) => {
            console.error("复制失败:", err);
          });
      });
      actionsDiv.appendChild(copyBtn);
    }

    // 查看按钮
    if (!file.isDirectory) {
      const viewBtn = createActionButton("查看", "bi-eye", () =>
        viewFile(file)
      );
      actionsDiv.appendChild(viewBtn);
    }

    // 重命名按钮
    const renameBtn = createActionButton("重命名", "bi-pencil", () =>
      showRenameModal(file)
    );
    actionsDiv.appendChild(renameBtn);

    // 删除按钮
    const deleteBtn = createActionButton("删除", "bi-trash", () =>
      deleteFile(file.path)
    );
    actionsDiv.appendChild(deleteBtn);

    actionsCell.appendChild(actionsDiv);
  }

  row.appendChild(actionsCell);

  return row;
}

// 创建操作按钮
function createActionButton(title, iconClass, clickHandler) {
  const button = document.createElement("button");
  button.className = "btn btn-sm btn-light file-action-btn";
  button.title = title;
  button.innerHTML = `<i class="bi ${iconClass}"></i>`;
  button.addEventListener("click", (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    clickHandler();
  });
  return button;
}

// 获取文件图标类
function getFileIconClass(file) {
  if (file.isDirectory) {
    return "bi-folder-fill folder-icon";
  }

  if (file.isParent) {
    return "bi-arrow-up-circle-fill text-secondary";
  }

  const ext = file.name.split(".").pop().toLowerCase();

  // 文本文件
  if (["txt", "log", "md", "rtf", "csv"].includes(ext)) {
    return "bi-file-text text-file-icon";
  }

  // 图片文件
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext)) {
    return "bi-file-image image-file-icon";
  }

  // 视频文件
  if (["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"].includes(ext)) {
    return "bi-file-play video-file-icon";
  }

  // 音频文件
  if (["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext)) {
    return "bi-file-music audio-file-icon";
  }

  // 压缩文件
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) {
    return "bi-file-zip archive-file-icon";
  }

  // 代码文件
  if (
    [
      "js",
      "html",
      "css",
      "php",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "cs",
      "rb",
      "go",
      "ts",
      "jsx",
      "vue",
    ].includes(ext)
  ) {
    return "bi-file-code code-file-icon";
  }

  // PDF文件
  if (ext === "pdf") {
    return "bi-file-pdf pdf-file-icon";
  }

  // 默认图标
  return "bi-file-earmark";
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + units[i];
}

// 格式化日期
function formatDate(date) {
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

// 获取父路径
function getParentPath(path) {
  // 处理路径分隔符为统一格式
  path = path.replace(/\\/g, "/");

  // 如果路径以斜杠结尾，则去掉结尾的斜杠
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  // 如果是驱动器根目录，返回驱动器本身
  if (/^[A-Z]:$/i.test(path) || /^[A-Z]:\/$/i.test(path)) {
    return path.slice(0, 2);
  }

  const parts = path.split("/");
  parts.pop();

  // 如果是驱动器路径的子目录，确保返回的是驱动器根目录
  if (parts.length === 1 && parts[0].endsWith(":")) {
    return parts[0];
  }

  return parts.join("/") || path.slice(0, 2);
}

// 更新面包屑导航
function updateBreadcrumb(path) {
  pathBreadcrumb.innerHTML = "";

  // 处理路径分隔符为统一格式
  path = path.replace(/\\/g, "/");

  // 分割路径
  let parts = [];
  if (/^[A-Z]:\/?.*/i.test(path)) {
    // Windows 路径格式
    const driveLetter = path.slice(0, 2);
    parts.push(driveLetter);

    if (path.length > 2) {
      // 添加剩余部分
      const remainingPath = path.slice(3);
      if (remainingPath) {
        parts = parts.concat(remainingPath.split("/").filter(Boolean));
      }
    }
  } else {
    // 标准路径格式
    parts = path.split("/").filter(Boolean);
    if (parts.length === 0) {
      parts.push("/");
    }
  }

  let currentPath = "";

  parts.forEach((part, index) => {
    // 构建当前路径段
    if (index === 0 && /^[A-Z]:$/i.test(part)) {
      // 驱动器盘符
      currentPath = part;
    } else {
      if (currentPath.endsWith(":")) {
        currentPath += "/";
      } else if (currentPath && !currentPath.endsWith("/")) {
        currentPath += "/";
      }
      currentPath += part;
    }

    const li = document.createElement("li");
    li.className = "breadcrumb-item";

    if (index === parts.length - 1) {
      li.classList.add("active");
      li.textContent = part;
    } else {
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = part;
      a.dataset.path = currentPath;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        loadFolder(e.target.dataset.path);
      });
      li.appendChild(a);
    }

    pathBreadcrumb.appendChild(li);
  });

  // 调整面包屑导航的可见性
  setTimeout(adjustBreadcrumbVisibility, 0);
}

// 查看文件
async function viewFile(file) {
  try {
    // 获取文件类型
    const ext = file.name.split(".").pop().toLowerCase();

    // 判断是否是媒体文件（图片或视频）
    const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
    const videoExts = ["mp4", "webm", "ogg", "mov"];

    const isImage = imageExts.includes(ext.toLowerCase());
    const isVideo = videoExts.includes(ext.toLowerCase());

    // 如果是图片或视频，使用全屏预览
    if (isImage || isVideo) {
      try {
        console.log("请求文件内容:", file.path);

        // 如果有正在进行的请求，中止它
        if (currentMediaRequest && currentMediaRequest.abort) {
          currentMediaRequest.abort();
        }

        // 创建一个可以被中止的请求
        const controller = new AbortController();
        const signal = controller.signal;
        currentMediaRequest = controller;

        const response = await fetch(
          `/api/file/content?path=${encodeURIComponent(file.path)}`,
          {
            signal: signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("文件内容响应:", data);

        // 添加时间戳和随机数防止缓存
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const mediaUrl = `${data.url}?t=${timestamp}&r=${randomStr}`;

        if (isImage) {
          // 标记图片正在加载
          imageLoadingInProgress = true;

          // 显示加载中
          mediaPreviewOverlay.classList.remove("d-none");
          fullscreenImageViewer.classList.remove("d-none");

          // 先清除旧的事件处理器
          fullscreenImage.onload = null;
          fullscreenImage.onerror = null;

          // 设置图片加载事件
          fullscreenImage.onload = () => {
            console.log("全屏图片加载成功");
            // 加载完成后标记为非加载状态
            imageLoadingInProgress = false;
          };

          // 图片加载失败处理
          fullscreenImage.onerror = (e) => {
            // 只有在图片仍在加载时才处理错误
            if (imageLoadingInProgress) {
              console.error("全屏图片加载失败:", e);
              // 标记为非加载状态
              imageLoadingInProgress = false;
              closeMediaPreview();
            }
          };

          // 设置图片源
          fullscreenImage.src = mediaUrl;
        } else if (isVideo) {
          // 显示视频预览
          mediaPreviewOverlay.classList.remove("d-none");
          fullscreenVideoViewer.classList.remove("d-none");

          // 先清除旧的事件处理器
          fullscreenVideo.onerror = null;
          fullscreenVideo.onended = null;

          // 视频加载失败处理
          fullscreenVideo.onerror = (e) => {
            console.error("全屏视频加载失败:", e);
            closeMediaPreview();
          };

          // 视频加载结束事件
          fullscreenVideo.onended = () => {
            console.log("视频播放结束");
          };

          // 设置视频源
          fullscreenVideo.src = mediaUrl;
          fullscreenVideo.type = data.mimeType;

          // 自动播放
          fullscreenVideo.play().catch((e) => {
            console.warn("自动播放失败:", e);
          });
        }

        // 清除当前请求引用
        currentMediaRequest = null;
      } catch (error) {
        // 如果是中止请求导致的错误，不需要处理
        if (error.name === "AbortError") {
          console.log("媒体请求已被中止");
          return;
        }

        console.error("获取媒体文件内容失败:", error);
        imageLoadingInProgress = false; // 确保重置图片加载状态
        closeMediaPreview();
      }
    } else {
      // 非媒体文件，使用模态框预览
      try {
        // 重置所有查看器
        resetFileViewers();

        // 设置模态框标题
        fileContentModalLabel.textContent = file.name;

        // 显示加载中提示
        fileContentViewer.textContent = "加载文件内容中...";
        fileContentViewer.style.display = "block";

        // 获取文件内容
        console.log("请求文件内容:", file.path);
        const response = await fetch(
          `/api/file/content?path=${encodeURIComponent(file.path)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("文件内容响应:", data);

        // 重置查看器
        resetFileViewers();

        // 根据文件类型显示内容
        if (data.type === "text") {
          // 显示文本内容
          fileContentViewer.textContent = data.content;
          fileContentViewer.style.display = "block";

          // 设置下载链接
          downloadFileBtn.href = `/api/file/download?path=${encodeURIComponent(
            file.path
          )}`;
          downloadFileBtn.download = file.name;
        } else if (data.type === "audio") {
          // 显示音频
          audioPlayer.classList.remove("d-none");

          // 音频加载失败处理
          previewAudio.onerror = (e) => {
            console.error("音频加载失败:", e);
            console.error("音频URL:", data.url);
            audioPlayer.classList.add("d-none");
            unsupportedFileViewer.classList.remove("d-none");
            unsupportedFileViewer.querySelector("h5").textContent =
              "音频加载失败";
            unsupportedFileViewer.querySelector("p").innerHTML = `
                            可能是权限问题或格式不支持<br>
                            <small class="text-muted">URL: ${data.url}</small>
                        `;
          };

          // 设置音频源 - 添加时间戳防止缓存
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          previewAudio.src = `${data.url}?t=${timestamp}&r=${randomStr}`;
          previewAudio.type = data.mimeType;

          // 设置下载链接
          downloadFileBtn.href = data.url;
          downloadFileBtn.download = file.name;
        } else {
          // 其他文件类型，显示不支持预览的提示
          unsupportedFileViewer.classList.remove("d-none");

          // 设置下载链接
          downloadFileBtn.href = data.downloadUrl;
          downloadFileBtn.download = file.name;
        }

        // 显示模态框
        fileContentModal.show();
      } catch (error) {
        console.error("获取文件内容失败:", error);

        // 显示错误信息
        resetFileViewers();
        fileContentViewer.textContent = `获取文件内容失败: ${error.message}`;
        fileContentViewer.style.display = "block";
        fileContentModal.show();
      }
    }
  } catch (error) {
    console.error("查看文件失败:", error);
    console.warn(`查看文件失败: ${error.message}`);
    imageLoadingInProgress = false; // 确保重置图片加载状态
  }
}

// 重置所有文件查看器
function resetFileViewers() {
  // 隐藏所有查看器
  fileContentViewer.style.display = "none";
  imageViewer.classList.add("d-none");
  videoPlayer.classList.add("d-none");
  audioPlayer.classList.add("d-none");
  unsupportedFileViewer.classList.add("d-none");

  // 清空媒体源
  previewImage.src = "";
  previewVideo.src = "";
  previewAudio.src = "";
}

// 删除文件
async function deleteFile(filePath) {
  if (!confirm("确认要删除此文件吗？文件将被移至回收站")) {
    return;
  }

  try {
    const response = await fetch(
      `/api/file?path=${encodeURIComponent(filePath)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.warn("文件已移至回收站");
      // 重新加载当前文件夹
      loadFolder(currentPath);
    } else {
      throw new Error(data.error || "未知错误");
    }
  } catch (error) {
    console.error("删除文件失败:", error);
    console.warn(`删除文件失败: ${error.message}`);
  }
}

// 显示重命名模态框
function showRenameModal(file) {
  oldFilePathInput.value = file.path;
  newFilenameInput.value = file.name;
  renameModal.show();
  setTimeout(() => newFilenameInput.select(), 300);
}

// 重命名文件
async function renameFile(oldPath, newName) {
  try {
    const response = await fetch("/api/file/rename", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        oldPath,
        newName,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // 隐藏模态框
      renameModal.hide();

      // 重新加载当前文件夹
      loadFolder(currentPath);
    } else {
      throw new Error(data.error || "未知错误");
    }
  } catch (error) {
    console.error("重命名文件失败:", error);
    console.warn(`重命名文件失败: ${error.message}`);
  }
}

// 搜索文件
async function searchFiles(query) {
  try {
    // 显示加载指示器
    fileTable.style.display = "none";
    loadingIndicator.style.display = "flex";

    // 发送搜索请求
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 清空文件列表
    fileList.innerHTML = "";

    // 更新状态信息
    statusInfo.textContent = `搜索 "${query}" 的结果: ${
      data.results ? data.results.length : 0
    } 个项目`;
    currentPathDisplay.textContent = `搜索: ${query}`;

    // 更新面包屑导航（搜索模式）
    pathBreadcrumb.innerHTML = `
            <li class="breadcrumb-item"><a href="#" data-path="${currentPath}">返回文件夹</a></li>
            <li class="breadcrumb-item active">搜索结果: ${query}</li>
        `;

    // 添加事件监听器返回当前文件夹
    pathBreadcrumb.querySelector("a").addEventListener("click", (e) => {
      e.preventDefault();
      loadFolder(e.target.dataset.path);
    });

    if (data.results && data.results.length > 0) {
      // 添加搜索结果到列表
      data.results.forEach((file) => {
        const row = createSearchResultRow(file, query);
        fileList.appendChild(row);
      });
    } else {
      // 没有搜索结果
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 5;
      emptyCell.className = "text-center p-4 text-muted";
      emptyCell.textContent = "没有找到匹配的文件";
      emptyRow.appendChild(emptyCell);
      fileList.appendChild(emptyRow);
    }

    // 隐藏加载指示器，显示文件表格
    loadingIndicator.style.display = "none";
    fileTable.style.display = "table";
  } catch (error) {
    console.error("搜索文件失败:", error);
    console.warn(`搜索文件失败: ${error.message}`);
    loadingIndicator.style.display = "none";
    fileTable.style.display = "table";
  }
}

// 创建搜索结果行
function createSearchResultRow(file, query) {
  const row = document.createElement("tr");

  // 设置单击事件（替换原来的双击事件）
  row.addEventListener("click", () => {
    if (file.path) {
      if (file.isDirectory) {
        loadFolder(file.path);
      } else {
        viewFile(file);
      }
    }
  });

  // 添加触摸事件处理，防止在移动设备上双击缩放
  row.addEventListener("touchstart", (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;

    clearTimeout(touchTimer);

    if (tapLength < 500 && tapLength > 0) {
      // 双击事件
      e.preventDefault(); // 阻止默认行为，防止缩放
      if (file.path) {
        if (file.isDirectory) {
          loadFolder(file.path);
        } else {
          viewFile(file);
        }
      }
    } else {
      // 单击事件处理
      touchTimer = setTimeout(() => {
        // 单击操作可以在这里处理
      }, 300);
    }
    lastTapTime = currentTime;
  });

  // 文件图标
  const iconCell = document.createElement("td");
  const icon = document.createElement("i");
  icon.className = `bi file-icon ${getFileIconClass(file)}`;
  iconCell.appendChild(icon);
  row.appendChild(iconCell);

  // 文件名
  const nameCell = document.createElement("td");

  // 高亮匹配的关键词
  if (file.name.toLowerCase().includes(query.toLowerCase())) {
    const index = file.name.toLowerCase().indexOf(query.toLowerCase());
    const before = file.name.substring(0, index);
    const highlight = file.name.substring(index, index + query.length);
    const after = file.name.substring(index + query.length);

    nameCell.innerHTML = `${before}<span class="search-highlight">${highlight}</span>${after}`;
  } else {
    nameCell.textContent = file.name;
  }

  // 添加路径信息
  const pathSpan = document.createElement("div");
  pathSpan.className = "small text-muted";
  pathSpan.textContent = file.path || "";
  nameCell.appendChild(pathSpan);

  row.appendChild(nameCell);

  // 文件大小
  const sizeCell = document.createElement("td");
  sizeCell.textContent = file.isDirectory ? "" : formatFileSize(file.size || 0);
  row.appendChild(sizeCell);

  // 修改日期
  const dateCell = document.createElement("td");
  dateCell.textContent = file.modifiedTime
    ? formatDate(new Date(file.modifiedTime))
    : "";
  row.appendChild(dateCell);

  // 操作按钮
  const actionsCell = document.createElement("td");
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "action-icons d-flex gap-2";

  // 判断文件类型
  if (file.path && !file.isDirectory) {
    const ext = file.name.split(".").pop().toLowerCase();
    const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
    const videoExts = ["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv"];

    const isImage = imageExts.includes(ext);
    const isVideo = videoExts.includes(ext);

    // 复制按钮 (仅对图片和视频文件显示)
    if (isImage || isVideo) {
      const copyBtn = createActionButton("复制文件名", "bi-clipboard", () => {
        navigator.clipboard
          .writeText(file.name)
          .then(() => {
            console.warn("文件名已复制到剪贴板");
            // 显示一个临时提示
            const toast = document.createElement("div");
            toast.className = "toast-notification";
            toast.textContent = "文件名已复制";
            document.body.appendChild(toast);
            setTimeout(() => {
              toast.classList.add("show");
              setTimeout(() => {
                toast.classList.remove("show");
                setTimeout(() => {
                  document.body.removeChild(toast);
                }, 300);
              }, 2000);
            }, 10);
          })
          .catch((err) => {
            console.error("复制失败:", err);
          });
      });
      actionsDiv.appendChild(copyBtn);
    }
  }

  // 查看按钮
  if (!file.isDirectory) {
    const viewBtn = createActionButton("查看", "bi-eye", () => viewFile(file));
    actionsDiv.appendChild(viewBtn);
  }

  // 打开所在文件夹按钮
  if (file.path) {
    const openFolderBtn = createActionButton(
      "打开所在文件夹",
      "bi-folder",
      () => {
        const folderPath = file.path.substring(0, file.path.lastIndexOf("/"));
        loadFolder(folderPath || "C:");
      }
    );
    actionsDiv.appendChild(openFolderBtn);
  }

  actionsCell.appendChild(actionsDiv);
  row.appendChild(actionsCell);

  return row;
}

// 绑定移动端导航事件
function bindMobileNavEvents() {
  // 导航按钮点击事件
  if (showSidebarBtn) {
    console.log("绑定导航按钮事件");
    showSidebarBtn.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("导航按钮被点击");
      showSidebar();
    });
  }

  // 首页按钮点击事件
  if (homeBtn) {
    homeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("首页按钮被点击");
      // 回到根目录（默认C盘）
      loadFolder("C:");
    });
  }

  // 搜索按钮点击事件
  if (searchMobileBtn) {
    searchMobileBtn.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("搜索按钮被点击");
      // 聚焦到搜索框
      searchInput.focus();
    });
  }

  // 在移动设备上点击文件夹项后自动隐藏侧边栏
  document
    .querySelectorAll("#drivesList li, .shortcut-list li")
    .forEach((item) => {
      item.addEventListener("click", () => {
        if (window.innerWidth < 768 && sidebar.classList.contains("show")) {
          hideSidebar();
        }
      });
    });

  // 监听驱动器列表变化，为新添加的项添加点击事件
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // 为新添加的驱动器项添加点击事件
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches("[data-path]")) {
            node.addEventListener("click", () => {
              if (
                window.innerWidth < 768 &&
                sidebar.classList.contains("show")
              ) {
                hideSidebar();
              }
            });
          }
        });
      }
    });
  });

  // 监听驱动器列表的变化
  observer.observe(drivesList, { childList: true });
}
