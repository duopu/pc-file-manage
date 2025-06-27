// 全局变量
let currentPath = ""; // 默认不设置初始路径，等待加载驱动器

// 添加一个变量用于跟踪当前媒体请求
let currentMediaRequest = null;
// 添加变量用于跟踪图片加载状态
let imageLoadingInProgress = false;
// 添加变量用于跟踪触摸事件
let lastTapTime = 0;
let touchTimer = null;

// 添加导航历史相关变量
let navigationHistory = [];
let currentHistoryIndex = -1;

// 添加主题相关变量
let currentTheme = localStorage.getItem('theme') || 'light';

// 添加图片浏览相关变量
let currentFolderImages = []; // 当前文件夹中的所有图片
let currentImageIndex = -1;   // 当前显示的图片索引

// 添加视频浏览相关变量
let currentFolderVideos = []; // 当前文件夹中的所有视频
let currentVideoIndex = -1;   // 当前显示的视频索引

// DOM 元素
const fileList = document.getElementById("fileList");
const fileTable = document.getElementById("fileTable");
const loadingIndicator = document.getElementById("loadingIndicator");
const pathBreadcrumb = document.getElementById("pathBreadcrumb");
const statusInfo = document.getElementById("statusInfo");

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

// 导航按钮元素
const goBackBtn = document.getElementById("goBackBtn");
const goForwardBtn = document.getElementById("goForwardBtn");
const goUpBtn = document.getElementById("goUpBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");

// 新增的删除确认和提示元素
const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteFileName = document.getElementById('deleteFileName');
const deleteFilePath = document.getElementById('deleteFilePath');
const operationToast = new bootstrap.Toast(document.getElementById('operationToast'));
const toastMessage = document.getElementById('toastMessage');

// 文件详情模态框元素
const fileDetailsModal = new bootstrap.Modal(document.getElementById('fileDetailsModal'));
const fileDetailsLoading = document.getElementById('fileDetailsLoading');
const fileDetailsContent = document.getElementById('fileDetailsContent');
const detailsFileName = document.getElementById('detailsFileName');
const detailsFilePath = document.getElementById('detailsFilePath');
const detailsFileType = document.getElementById('detailsFileType');
const detailsFileSize = document.getElementById('detailsFileSize');
const detailsFileCreated = document.getElementById('detailsFileCreated');
const detailsFileModified = document.getElementById('detailsFileModified');
const detailsFileAccessed = document.getElementById('detailsFileAccessed');
const mediaInfoCard = document.getElementById('mediaInfoCard');
const mediaInfoGeneralTable = document.getElementById('mediaInfoGeneralTable');
const videoInfoSection = document.getElementById('videoInfoSection');
const videoInfoTable = document.getElementById('videoInfoTable');
const audioInfoSection = document.getElementById('audioInfoSection');
const audioInfoTable = document.getElementById('audioInfoTable');
const mediaInfoError = document.getElementById('mediaInfoError');
const mediaInfoErrorText = document.getElementById('mediaInfoErrorText');

// 媒体预览元素
const mediaPreviewOverlay = document.getElementById("mediaPreviewOverlay");
const mediaCloseBtn = document.getElementById("mediaCloseBtn");
const fullscreenImageViewer = document.getElementById("fullscreenImageViewer");
const fullscreenImage = document.getElementById("fullscreenImage");
const fullscreenVideoViewer = document.getElementById("fullscreenVideoViewer");
const fullscreenVideo = document.getElementById("fullscreenVideo");
const prevImageBtn = document.getElementById("prevImageBtn");
const nextImageBtn = document.getElementById("nextImageBtn");
const prevVideoBtn = document.getElementById("prevVideoBtn");
const nextVideoBtn = document.getElementById("nextVideoBtn");
const videoTitle = document.getElementById("videoTitle");
const imageTitle = document.getElementById("imageTitle");

// 响应式布局元素
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("mainContent");

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  // 应用保存的主题设置
  applyTheme(currentTheme);

  // 修正快捷导航路径
  fixShortcutPaths();

  // 加载磁盘驱动器
  loadDrives();

  // 绑定事件监听器
  bindEventListeners();

  // 绑定导航按钮事件
  bindNavigationButtons();

  // 绑定主题切换按钮事件
  bindThemeToggle();

  // 绑定媒体预览关闭按钮事件
  mediaCloseBtn.addEventListener("click", closeMediaPreview);

  // 绑定图片导航按钮事件
  if (prevImageBtn) {
    prevImageBtn.addEventListener("click", showPreviousImage);
  }
  if (nextImageBtn) {
    nextImageBtn.addEventListener("click", showNextImage);
  }

  // 绑定视频导航按钮事件
  if (prevVideoBtn) {
    prevVideoBtn.addEventListener("click", showPreviousVideo);
  }
  if (nextVideoBtn) {
    nextVideoBtn.addEventListener("click", showNextVideo);
  }

  // 监听ESC键关闭媒体预览
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      !mediaPreviewOverlay.classList.contains("d-none")
    ) {
      closeMediaPreview();
    }

    // 添加左右箭头键导航支持
    if (!mediaPreviewOverlay.classList.contains("d-none")) {
      if (fullscreenImageViewer && !fullscreenImageViewer.classList.contains("d-none")) {
        if (e.key === "ArrowLeft") {
          showPreviousImage();
        } else if (e.key === "ArrowRight") {
          showNextImage();
        }
      } else if (fullscreenVideoViewer && !fullscreenVideoViewer.classList.contains("d-none")) {
        if (e.key === "ArrowLeft") {
          showPreviousVideo();
        } else if (e.key === "ArrowRight") {
          showNextVideo();
        }
      }
    }
  });

  // 绑定移动端底部导航栏事件
  bindMobileNavEvents();

  // 创建侧边栏背景遮罩
  createSidebarBackdrop();

  // 监听窗口大小变化，调整布局
  window.addEventListener("resize", handleWindowResize);

  // 初始化时执行一次窗口大小检查
  handleWindowResize();

  // 绑定删除确认按钮事件
  confirmDeleteBtn.addEventListener('click', () => {
    const filePath = deleteFilePath.value;
    if (filePath) {
      deleteFile(filePath);
      deleteConfirmModal.hide();
    }
  });

  // 监听路径导航滚动事件
  const pathContainer = document.querySelector('.path-navigation .d-flex');
  if (pathContainer) {
    pathContainer.addEventListener('scroll', () => {
      // 检测滚动位置，显示左侧渐变指示器
      if (pathContainer.scrollLeft > 10) {
        pathContainer.classList.add('scrolled');
      } else {
        pathContainer.classList.remove('scrolled');
      }

      // 检测是否有溢出
      checkPathOverflow();
    });
  }

  // 监听下拉菜单打开事件，确保一次只打开一个下拉菜单
  document.addEventListener('show.bs.dropdown', (e) => {
    // 获取所有当前打开的下拉菜单
    const openDropdowns = document.querySelectorAll('.dropdown-menu.show');

    // 关闭所有其他打开的下拉菜单
    openDropdowns.forEach(menu => {
      // 确保不是当前正在打开的菜单
      if (menu !== e.target.querySelector('.dropdown-menu')) {
        const parentDropdown = menu.closest('.dropdown');
        if (parentDropdown) {
          const dropdownInstance = bootstrap.Dropdown.getInstance(parentDropdown.querySelector('[data-bs-toggle="dropdown"]'));
          if (dropdownInstance) {
            dropdownInstance.hide();
          }
        }
      }
    });
  });

  const floatingThemeToggleBtn = document.getElementById('floatingThemeToggleBtn');

  if (floatingThemeToggleBtn) {
    floatingThemeToggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleTheme();
      // 同步图标
      const icon = floatingThemeToggleBtn.querySelector('i');
      if (icon) {
        if (currentTheme === 'dark') {
          icon.className = 'bi bi-sun-fill';
        } else {
          icon.className = 'bi bi-moon-fill';
        }
      }
      // 关闭菜单
      // floatingNavBtn.classList.remove('active');
      // floatingNavMenu.classList.remove('show');
    });
    // 初始化时同步图标
    const icon = floatingThemeToggleBtn.querySelector('i');
    if (icon) {
      if (currentTheme === 'dark') {
        icon.className = 'bi bi-sun-fill';
      } else {
        icon.className = 'bi bi-moon-fill';
      }
    }
  }

  // 绑定侧边栏关闭按钮事件
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', function () {
      hideSidebar();
    });
  }
});

// 修正快捷导航路径，确保使用绝对路径
function fixShortcutPaths() {
  document.querySelectorAll('.shortcut-list .list-group-item').forEach(item => {
    const path = item.dataset.path;
    if (path && path.startsWith('C:/')) {
      // 确保路径格式正确，使用绝对路径
      item.dataset.path = path;
    }
  });
}

// 绑定主题切换按钮事件
function bindThemeToggle() {
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);

    // 根据当前主题设置按钮图标
    updateThemeIcon();
  }
}

// 切换主题
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(currentTheme);
  localStorage.setItem('theme', currentTheme);
}

// 应用主题
function applyTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  updateThemeIcon();
}

// 更新主题图标
function updateThemeIcon() {
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector('i');
    if (icon) {
      if (currentTheme === 'dark') {
        icon.className = 'bi bi-sun-fill';
      } else {
        icon.className = 'bi bi-moon-fill';
      }
    }
  }
}

// 绑定导航按钮事件
function bindNavigationButtons() {
  if (goBackBtn) {
    goBackBtn.addEventListener("click", navigateBack);
    goBackBtn.classList.add("disabled"); // 初始状态禁用
  }

  if (goForwardBtn) {
    goForwardBtn.addEventListener("click", navigateForward);
    goForwardBtn.classList.add("disabled"); // 初始状态禁用
  }

  if (goUpBtn) {
    goUpBtn.addEventListener("click", navigateUp);
  }
}

// 导航到上一页
function navigateBack() {
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    const previousPath = navigationHistory[currentHistoryIndex];
    loadFolderWithoutHistory(previousPath);
    updateNavigationButtons();
  }
}

// 导航到下一页
function navigateForward() {
  if (currentHistoryIndex < navigationHistory.length - 1) {
    currentHistoryIndex++;
    const nextPath = navigationHistory[currentHistoryIndex];
    loadFolderWithoutHistory(nextPath);
    updateNavigationButtons();
  }
}

// 导航到上一级目录
function navigateUp() {
  if (currentPath && currentPath.length > 3) { // 不是根目录
    const parentPath = getParentPath(currentPath);
    loadFolder(parentPath);
  }
}

// 更新导航按钮状态
function updateNavigationButtons() {
  if (goBackBtn) {
    if (currentHistoryIndex > 0) {
      goBackBtn.classList.remove("disabled");
    } else {
      goBackBtn.classList.add("disabled");
    }
  }

  if (goForwardBtn) {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      goForwardBtn.classList.remove("disabled");
    } else {
      goForwardBtn.classList.add("disabled");
    }
  }
}

// 添加路径到历史记录
function addToHistory(path) {
  // 如果当前不是在历史记录的最后，则移除当前位置之后的所有记录
  if (currentHistoryIndex < navigationHistory.length - 1) {
    navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
  }

  // 添加新路径到历史记录
  navigationHistory.push(path);
  currentHistoryIndex = navigationHistory.length - 1;

  // 更新导航按钮状态
  updateNavigationButtons();
}

// 不添加历史记录的加载文件夹
function loadFolderWithoutHistory(path) {
  try {
    // 处理Windows驱动器盘符
    let folderPath = path;

    // 显示加载指示器
    fileTable.style.display = "none";
    loadingIndicator.style.display = "flex";

    // 发送请求获取文件夹内容
    fetch(`/api/folder?path=${ encodeURIComponent(folderPath) }`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${ response.status }`);
        }
        return response.json();
      })
      .then(data => {
        // 更新当前路径
        currentPath = folderPath;
        updatePathDisplay(currentPath);

        // 清空文件列表
        fileList.innerHTML = "";

        // 如果不是根驱动器，添加"返回上一级"项
        if (folderPath.length > 3 || (folderPath.length === 3 && folderPath.endsWith("/"))) {
          // 例如 "C:/" 长度为3
          const parentPath = getParentPath(folderPath);
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

        // 收集当前文件夹中的所有图片和视频
        collectImagesInFolder(sortedFiles);

        // 添加文件和文件夹到列表
        sortedFiles.forEach((file) => {
          const row = createFileRow(file);
          fileList.appendChild(row);
        });

        // 更新状态信息
        statusInfo.textContent = `${ data.files.length } 个项目`;

        // 隐藏加载指示器，显示文件表格
        loadingIndicator.style.display = "none";
        fileTable.style.display = "table";
      })
      .catch(error => {
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
          <p>${ error.message }</p>
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
          if (folderPath.length > 3) {
            loadFolder(getParentPath(folderPath));
          } else {
            // 如果是根目录，尝试重新加载驱动器
            loadDrives();
          }
        });

        // 隐藏加载指示器，显示文件表格
        loadingIndicator.style.display = "none";
        fileTable.style.display = "table";
      });
  } catch (error) {
    console.error("加载文件夹失败:", error);
  }
}

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

  // 检查路径导航溢出
  checkPathOverflow();

  // 调整面包屑导航的可见性
  adjustBreadcrumbVisibility();
}

// 调整面包屑导航的可见性
function adjustBreadcrumbVisibility() {
  // 确保面包屑导航在移动设备上可以滚动查看
  const container = pathBreadcrumb.parentElement.parentElement;

  if (container && pathBreadcrumb.scrollWidth > container.clientWidth) {
    container.classList.add('has-overflow');
  } else if (container) {
    container.classList.remove('has-overflow');
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

  // 重置当前图片索引
  currentImageIndex = -1;

  // 重置当前视频索引
  currentVideoIndex = -1;

  // 清除视频标题
  if (videoTitle) {
    videoTitle.textContent = "";
  }

  // 清除图片标题
  if (imageTitle) {
    imageTitle.textContent = "";
  }

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
      throw new Error(`HTTP error! status: ${ response.status }`);
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
        li.innerHTML = `<i class="bi bi-hdd me-2"></i> ${ drive.name }`;

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
                加载失败: ${ error.message }
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
  // 只更新面包屑导航
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
    // 处理Windows驱动器盘符
    let folderPath = path;

    // 显示加载指示器
    fileTable.style.display = "none";
    loadingIndicator.style.display = "flex";

    // 发送请求获取文件夹内容
    const response = await fetch(
      `/api/folder?path=${ encodeURIComponent(folderPath) }`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${ response.status }`);
    }

    const data = await response.json();

    // 添加到历史记录
    addToHistory(folderPath);

    // 更新当前路径
    currentPath = folderPath;
    updatePathDisplay(currentPath);

    // 清空文件列表
    fileList.innerHTML = "";

    // 如果不是根驱动器，添加"返回上一级"项
    if (folderPath.length > 3 || (folderPath.length === 3 && folderPath.endsWith("/"))) {
      // 例如 "C:/" 长度为3
      const parentPath = getParentPath(folderPath);
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

    // 收集当前文件夹中的所有图片和视频
    collectImagesInFolder(sortedFiles);

    // 添加文件和文件夹到列表
    sortedFiles.forEach((file) => {
      const row = createFileRow(file);
      fileList.appendChild(row);
    });

    // 更新状态信息
    statusInfo.textContent = `${ data.files.length } 个项目`;

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
            <p>${ error.message }</p>
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
  icon.className = `bi file-icon ${ getFileIconClass(file) }`;
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

    // 编辑按钮 - 所有文件都显示
    const renameBtn = createActionButton("重命名", "bi-pencil", () =>
      showRenameModal(file)
    );
    actionsDiv.appendChild(renameBtn);

    // 图片和视频文件添加更多按钮和下拉菜单
    if (isImage || isVideo || !file.isDirectory) {
      // 创建下拉菜单容器
      const dropdownContainer = document.createElement("div");
      dropdownContainer.className = "dropdown";

      // 创建更多按钮
      const moreBtn = document.createElement("button");
      moreBtn.className = "btn btn-sm btn-light file-action-btn more-actions-btn dropdown-toggle";
      moreBtn.title = "更多操作";
      moreBtn.setAttribute("data-bs-toggle", "dropdown");
      moreBtn.setAttribute("aria-expanded", "false");
      moreBtn.innerHTML = `<i class="bi bi-three-dots"></i>`;

      // 创建下拉菜单
      const dropdownMenu = document.createElement("div");
      dropdownMenu.className = "dropdown-menu dropdown-menu-end";

      // 查看按钮 - 移到下拉菜单中
      if (!file.isDirectory) {
        const viewItem = document.createElement("a");
        viewItem.className = "dropdown-item";
        viewItem.href = "#";
        viewItem.innerHTML = `<i class="bi bi-eye"></i> 查看`;
        viewItem.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          viewFile(file);
        });
        dropdownMenu.appendChild(viewItem);
      }

      // 查看详情按钮 - 添加到下拉菜单
      const detailsItem = document.createElement("a");
      detailsItem.className = "dropdown-item";
      detailsItem.href = "#";
      detailsItem.innerHTML = `<i class="bi bi-info-circle"></i> 查看详情`;
      detailsItem.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showFileDetails(file.path);
      });
      dropdownMenu.appendChild(detailsItem);

      // 复制按钮 - 仅对图片和视频文件显示
      if (isImage || isVideo) {
        const copyItem = document.createElement("a");
        copyItem.className = "dropdown-item";
        copyItem.href = "#";
        copyItem.innerHTML = `<i class="bi bi-clipboard"></i> 复制文件名`;
        copyItem.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          navigator.clipboard
            .writeText(file.name)
            .then(() => {
              // 使用居中提示而不是Toast
              showCenteredMessage("文件名已复制到剪贴板");
            })
            .catch((err) => {
              console.error("复制失败:", err);
              showCenteredMessage("复制失败", "error");
            });
        });
        dropdownMenu.appendChild(copyItem);
      }

      // 删除按钮
      const deleteItem = document.createElement("a");
      deleteItem.className = "dropdown-item";
      deleteItem.href = "#";
      deleteItem.innerHTML = `<i class="bi bi-trash"></i> 删除`;
      deleteItem.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showDeleteConfirmModal(file.path);
      });
      dropdownMenu.appendChild(deleteItem);

      // 组装下拉菜单
      dropdownContainer.appendChild(moreBtn);
      dropdownContainer.appendChild(dropdownMenu);

      // 添加到操作栏
      actionsDiv.appendChild(dropdownContainer);

      // 防止点击下拉菜单时触发行点击事件
      dropdownContainer.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    } else {
      // 非图片和视频文件直接显示删除按钮
      const deleteBtn = createActionButton("删除", "bi-trash", () =>
        showDeleteConfirmModal(file.path)
      );
      actionsDiv.appendChild(deleteBtn);
    }

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
  button.innerHTML = `<i class="bi ${ iconClass }"></i>`;
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
  if (["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "ts"].includes(ext)) {
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
  if (path.endsWith("/") && path.length > 3) { // 保留 "C:/" 格式
    path = path.slice(0, -1);
  }

  // 如果是驱动器根目录，返回驱动器本身
  if (/^[A-Z]:$/i.test(path) || /^[A-Z]:\/$/i.test(path)) {
    return path.slice(0, 2);
  }

  // 分割路径
  const parts = path.split("/");

  // 如果只有一个部分，且是驱动器盘符，直接返回
  if (parts.length === 1 && /^[A-Z]:$/i.test(parts[0])) {
    return parts[0];
  }

  // 移除最后一个部分
  parts.pop();

  // 如果是驱动器路径的子目录，确保返回的是驱动器根目录
  if (parts.length === 1 && parts[0].endsWith(":")) {
    return parts[0] + "/"; // 返回形如 "C:/" 的格式
  }

  // 重新组合路径
  const parentPath = parts.join("/");

  // 如果父路径为空，但原路径以驱动器盘符开头，返回驱动器盘符
  if (!parentPath && /^[A-Z]:/i.test(path)) {
    return path.slice(0, 2);
  }

  return parentPath || path.slice(0, 2);
}

// 更新面包屑导航
function updateBreadcrumb(path) {
  pathBreadcrumb.innerHTML = "";

  // 添加根目录项
  const rootItem = document.createElement('li');
  rootItem.className = 'breadcrumb-item';
  const rootLink = document.createElement('a');
  rootLink.href = '#';
  rootLink.innerHTML = '<i class="bi bi-hdd"></i>';
  rootLink.title = '根目录';
  rootLink.addEventListener('click', (e) => {
    e.preventDefault();
    // 显示驱动器选择
    loadDrives();
  });
  rootItem.appendChild(rootLink);
  pathBreadcrumb.appendChild(rootItem);

  // 如果是驱动器根目录，不添加其他项
  if (!path || path === '/') {
    const activeItem = document.createElement('li');
    activeItem.className = 'breadcrumb-item active';
    activeItem.textContent = '我的电脑';
    pathBreadcrumb.appendChild(activeItem);

    // 检查溢出
    setTimeout(checkPathOverflow, 10);
    return;
  }

  // 解析路径组件
  const isWindowsPath = /^[A-Z]:/i.test(path);
  let components;

  if (isWindowsPath) {
    // 处理Windows路径
    const driveLetter = path.substring(0, 2); // 例如 "C:"
    const remainingPath = path.substring(2).replace(/\\/g, '/');
    components = remainingPath.split('/').filter(Boolean);

    // 添加驱动器盘符作为第一个组件
    const driveItem = document.createElement('li');
    driveItem.className = 'breadcrumb-item';
    const driveLink = document.createElement('a');
    driveLink.href = '#';
    driveLink.textContent = driveLetter;
    driveLink.addEventListener('click', (e) => {
      e.preventDefault();
      loadFolder(driveLetter);
    });
    driveItem.appendChild(driveLink);
    pathBreadcrumb.appendChild(driveItem);
  } else {
    // 处理UNIX样式路径
    components = path.split('/').filter(Boolean);
  }

  // 构建累积路径
  let currentPath = isWindowsPath ? path.substring(0, 2) : '';

  // 添加每个路径组件
  components.forEach((component, index) => {
    currentPath += (isWindowsPath && index === 0 ? '\\' : '/') + component;

    const item = document.createElement('li');

    if (index === components.length - 1) {
      // 最后一个组件（当前目录）
      item.className = 'breadcrumb-item active';
      item.setAttribute('aria-current', 'page');
      item.textContent = component;
    } else {
      // 中间路径组件
      item.className = 'breadcrumb-item';
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = component;

      // 使用闭包保存当前路径
      const pathToNavigate = currentPath;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        loadFolder(pathToNavigate);
      });

      item.appendChild(link);
    }

    pathBreadcrumb.appendChild(item);
  });

  // 检查溢出
  setTimeout(checkPathOverflow, 10);

  // 自动滚动到最右侧，保证当前路径可见
  const pathContainer = document.querySelector('.path-navigation .d-flex');
  if (pathContainer) {
    setTimeout(() => {
      pathContainer.scrollLeft = pathContainer.scrollWidth;
    }, 20);
  }
}

// 检查路径导航是否溢出并添加适当的类
function checkPathOverflow() {
  const pathContainer = document.querySelector('.path-navigation .d-flex');
  const breadcrumb = document.getElementById('pathBreadcrumb');

  if (pathContainer && breadcrumb) {
    // 检查是否有水平溢出
    const hasOverflow = breadcrumb.scrollWidth > pathContainer.clientWidth;

    if (hasOverflow) {
      pathContainer.classList.add('has-overflow');
    } else {
      pathContainer.classList.remove('has-overflow');
      pathContainer.classList.remove('scrolled');
    }
  }
}

// 查看文件
async function viewFile(file) {
  try {
    // 获取文件类型
    const ext = file.name.split(".").pop().toLowerCase();

    // 判断是否是媒体文件（图片或视频）
    const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
    const videoExts = ["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv"];

    const isImage = imageExts.includes(ext.toLowerCase());
    const isVideo = videoExts.includes(ext.toLowerCase());

    // 如果是图片或视频，使用全屏预览
    if (isImage || isVideo) {
      try {
        if (isImage) {
          // 使用loadImage函数加载图片
          loadImage(file);
        } else if (isVideo) {
          // 使用loadVideo函数加载视频
          loadVideo(file);
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
          `/api/file/content?path=${ encodeURIComponent(file.path) }`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${ response.status }`);
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
          downloadFileBtn.href = `/api/file/download?path=${ encodeURIComponent(
            file.path
          ) }`;
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
                            <small class="text-muted">URL: ${ data.url }</small>
                        `;
          };

          // 设置音频源 - 添加时间戳防止缓存
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          previewAudio.src = `${ data.url }?t=${ timestamp }&r=${ randomStr }`;
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
        fileContentViewer.textContent = `获取文件内容失败: ${ error.message }`;
        fileContentViewer.style.display = "block";
        fileContentModal.show();
      }
    }
  } catch (error) {
    console.error("查看文件失败:", error);
    console.warn(`查看文件失败: ${ error.message }`);
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

// 显示删除确认对话框
function showDeleteConfirmModal(filePath) {
  const fileName = filePath.split('/').pop();
  deleteFileName.textContent = fileName;
  deleteFilePath.value = filePath;
  deleteConfirmModal.show();
}

// 显示操作成功的Toast提示
function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  const toastElement = document.getElementById('operationToast');

  // 设置Toast的颜色
  toastElement.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
  switch (type) {
    case 'error':
      toastElement.classList.add('bg-danger');
      break;
    case 'warning':
      toastElement.classList.add('bg-warning');
      break;
    case 'info':
      toastElement.classList.add('bg-info');
      break;
    default:
      toastElement.classList.add('bg-success');
  }

  operationToast.show();
}

// 删除文件
async function deleteFile(filePath) {
  try {
    const response = await fetch(`/api/file?path=${ encodeURIComponent(filePath) }`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${ response.status }`);
    }

    const data = await response.json();

    if (data.success) {
      showToast('文件已移至回收站');
      // 重新加载当前文件夹
      loadFolder(currentPath);
    } else {
      throw new Error(data.error || '未知错误');
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    showToast(`删除文件失败: ${ error.message }`, 'error');
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
      throw new Error(`HTTP error! status: ${ response.status }`);
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
    console.warn(`重命名文件失败: ${ error.message }`);
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
  icon.className = `bi file-icon ${ getFileIconClass(file) }`;
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

    nameCell.innerHTML = `${ before }<span class="search-highlight">${ highlight }</span>${ after }`;
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

    // 查看详情按钮
    const detailsBtn = createActionButton("查看详情", "bi-info-circle", () => showFileDetails(file.path));
    actionsDiv.appendChild(detailsBtn);

    // 复制按钮 (仅对图片和视频文件显示)
    if (isImage || isVideo) {
      const copyBtn = createActionButton("复制文件名", "bi-clipboard", () => {
        navigator.clipboard
          .writeText(file.name)
          .then(() => {
            // 使用居中提示替代旧的提示方式
            showCenteredMessage("文件名已复制到剪贴板");
          })
          .catch((err) => {
            console.error("复制失败:", err);
            showCenteredMessage("复制失败", "error");
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

// 显示居中的消息提示
function showCenteredMessage(message, type = 'success') {
  // 创建或获取提示元素
  let messageElement = document.getElementById('centeredMessage');

  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.id = 'centeredMessage';
    messageElement.className = 'centered-message';
    document.body.appendChild(messageElement);
  }

  // 设置消息内容
  messageElement.textContent = message;

  // 设置样式类型
  messageElement.className = 'centered-message';
  if (type === 'error') {
    messageElement.classList.add('error');
  } else if (type === 'warning') {
    messageElement.classList.add('warning');
  } else {
    messageElement.classList.add('success');
  }

  // 显示消息
  messageElement.classList.add('show');

  // 设置定时器，自动隐藏
  setTimeout(() => {
    messageElement.classList.remove('show');
  }, 2000);
}

// 绑定移动端导航事件
function bindMobileNavEvents() {
  // const floatingNavBtn = document.getElementById('floatingNavBtn');
  // const floatingNavMenu = document.getElementById('floatingNavMenu');
  const showSidebarBtn = document.getElementById('showSidebarBtn');
  const homeBtn = document.getElementById('homeBtn');

  let isDragging = false;
  let moved = false; // 新增
  let dragJustFinished = false;
  let currentX = 40, currentY = window.innerHeight - 96;
  let initialX, initialY, startX, startY;

  function setTranslate(x, y, el) {
    el.style.transform = `translate3d(${ x }px, ${ y }px, 0)`;
  }

  // function updateMenuPosition(x, y) {
  //   const btnW = floatingNavBtn.offsetWidth;
  //   const btnH = floatingNavBtn.offsetHeight;
  //   const menuW = floatingNavMenu.offsetWidth;
  //   const menuH = floatingNavMenu.offsetHeight;
  //
  //   // 计算菜单位置，使其居中于按钮
  //   let left = x - (menuW - btnW) / 2;
  //   let top = y - (menuH - btnH) / 2;
  //
  //   // 边界检测，保证菜单不会超出屏幕
  //   left = Math.max(0, Math.min(left, window.innerWidth - menuW));
  //   top = Math.max(0, Math.min(top, window.innerHeight - menuH));
  //
  //   floatingNavMenu.style.left = `${left}px`;
  //   floatingNavMenu.style.top = `${top}px`;
  // }

  function onMove(e) {
    let clientX, clientY;
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    let dx = clientX - startX;
    let dy = clientY - startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true; // 新增
    let newX = initialX + dx;
    let newY = initialY + dy;
    // 用 offsetWidth/offsetHeight 保证色块能贴边
    const btnW = floatingNavBtn.offsetWidth;
    const btnH = floatingNavBtn.offsetHeight;
    newX = Math.max(0, Math.min(newX, window.innerWidth - btnW));
    newY = Math.max(0, Math.min(newY, window.innerHeight - btnH));
    currentX = newX;
    currentY = newY;
    setTranslate(currentX, currentY, floatingNavBtn);
    // updateMenuPosition(currentX, currentY);
  }

  function dragStart(e) {
    e.preventDefault();
    isDragging = true;
    moved = false; // 新增
    if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', dragEnd, false);
    } else {
      startX = e.clientX;
      startY = e.clientY;
      window.addEventListener('mousemove', onMove, false);
      window.addEventListener('mouseup', dragEnd, false);
    }
    initialX = currentX;
    initialY = currentY;
  }

  function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    dragJustFinished = true;
    setTimeout(() => {
      dragJustFinished = false;
    }, 120);
    saveButtonPosition(currentX, currentY);
    window.removeEventListener('mousemove', onMove, false);
    window.removeEventListener('mouseup', dragEnd, false);
    window.removeEventListener('touchmove', onMove, false);
    window.removeEventListener('touchend', dragEnd, false);
  }

  function saveButtonPosition(x, y) {
    localStorage.setItem('floatingNavBtnX', x);
    localStorage.setItem('floatingNavBtnY', y);
  }

  function loadButtonPosition() {
    const savedX = localStorage.getItem('floatingNavBtnX');
    const savedY = localStorage.getItem('floatingNavBtnY');
    if (savedX !== null && savedY !== null) {
      currentX = parseInt(savedX);
      currentY = parseInt(savedY);
    }
    setTranslate(currentX, currentY, floatingNavBtn);
    // updateMenuPosition(currentX, currentY);
  }

  // function layoutFloatingNavItems() {
  //   const menu = document.getElementById('floatingNavMenu');
  //   const items = menu.querySelectorAll('.floating-nav-item');
  //   const radius = 63; // 半径，单位px，原来是48
  //   const centerX = 60; // 容器宽度一半
  //   const centerY = 60; // 容器高度一半
  //   const N = items.length;
  //   for (let i = 0; i < N; i++) {
  //     const angle = (Math.PI * 2 / N) * i - Math.PI / 2;
  //     const x = centerX + radius * Math.cos(angle);
  //     const y = centerY + radius * Math.sin(angle);
  //     items[i].style.left = x + 'px';
  //     items[i].style.top = y + 'px';
  //   }
  // }

  // if (floatingNavBtn) {
  //   loadButtonPosition();
  //   floatingNavBtn.addEventListener('mousedown', dragStart, false);
  //   floatingNavBtn.addEventListener('touchstart', dragStart, {passive: false});
  //   floatingNavBtn.addEventListener('click', function(e) {
  //     if (isDragging) return;
  //     this.classList.toggle('active');
  //     // floatingNavMenu.classList.toggle('show');
  //     // if (floatingNavMenu.classList.contains('show')) layoutFloatingNavItems();
  //   });
  //   floatingNavBtn.addEventListener('touchend', function(e) {
  //     if (!moved) {
  //       this.classList.toggle('active');
  //       // floatingNavMenu.classList.toggle('show');
  //       // if (floatingNavMenu.classList.contains('show')) layoutFloatingNavItems();
  //     }
  //     isDragging = false;
  //   });
  // }

  window.addEventListener('resize', () => {
    // const btnW = floatingNavBtn.offsetWidth;
    // const btnH = floatingNavBtn.offsetHeight;
    // currentX = Math.max(0, Math.min(currentX, window.innerWidth - btnW));
    // currentY = Math.max(0, Math.min(currentY, window.innerHeight - btnH));
    // setTranslate(currentX, currentY, floatingNavBtn);
    // updateMenuPosition(currentX, currentY);
  });

  if (showSidebarBtn) {
    showSidebarBtn.addEventListener('click', function () {
      showSidebar();
      // floatingNavBtn.classList.remove('active');
      // floatingNavMenu.classList.remove('show');
    });
  }
  if (homeBtn) {
    homeBtn.addEventListener('click', function () {
      loadFolder("C:");
      // floatingNavBtn.classList.remove('active');
      // floatingNavMenu.classList.remove('show');
    });
  }

  document.querySelectorAll("#drivesList li, .shortcut-list li").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768 && sidebar.classList.contains("show")) {
        hideSidebar();
      }
    });
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches("[data-path]")) {
            node.addEventListener("click", () => {
              if (window.innerWidth < 768 && sidebar.classList.contains("show")) {
                hideSidebar();
              }
            });
          }
        });
      }
    });
  });
  observer.observe(drivesList, { childList: true });
}

// 显示文件详情
async function showFileDetails(filePath) {
  try {
    // 显示模态框和加载中状态
    fileDetailsModal.show();
    fileDetailsLoading.classList.remove('d-none');
    fileDetailsContent.classList.add('d-none');

    // 隐藏媒体信息卡片和错误信息
    mediaInfoCard.classList.add('d-none');
    mediaInfoError.classList.add('d-none');

    // 清空表格内容
    mediaInfoGeneralTable.innerHTML = '';
    videoInfoTable.innerHTML = '';
    audioInfoTable.innerHTML = '';

    // 获取文件详细信息
    let fileDetails;
    try {
      const response = await fetch(`/api/file/details?path=${ encodeURIComponent(filePath) }`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${ response.status }`);
      }

      fileDetails = await response.json();
      console.log('文件详细信息:', fileDetails);
    } catch (fetchError) {
      console.error('获取文件详情失败:', fetchError);

      // 显示错误信息
      mediaInfoError.classList.remove('d-none');
      mediaInfoErrorText.textContent = `获取文件详情失败: ${ fetchError.message }`;

      // 隐藏加载中状态，显示内容（虽然有错误）
      fileDetailsLoading.classList.add('d-none');
      fileDetailsContent.classList.remove('d-none');
      return;
    }

    // 填充基本信息
    detailsFileName.textContent = fileDetails.name || '未知';
    detailsFilePath.textContent = fileDetails.path || '未知';
    detailsFileType.textContent = `${ fileDetails.type || '未知' } (${ fileDetails.extension || '未知' })`;
    detailsFileSize.textContent = fileDetails.sizeFormatted || '未知';
    detailsFileCreated.textContent = fileDetails.created ? formatDate(new Date(fileDetails.created)) : '未知';
    detailsFileModified.textContent = fileDetails.modified ? formatDate(new Date(fileDetails.modified)) : '未知';
    detailsFileAccessed.textContent = fileDetails.accessed ? formatDate(new Date(fileDetails.accessed)) : '未知';

    // 处理媒体信息
    if (fileDetails.format || fileDetails.video || fileDetails.audio) {
      // 显示媒体信息卡片
      mediaInfoCard.classList.remove('d-none');

      // 填充通用媒体信息
      if (fileDetails.format) {
        addTableRow(mediaInfoGeneralTable, '格式', fileDetails.format.format_name || '未知');
        addTableRow(mediaInfoGeneralTable, '时长', fileDetails.duration || '未知');
        addTableRow(mediaInfoGeneralTable, '总比特率', fileDetails.bitrate || '未知');
      }

      // 填充视频信息
      if (fileDetails.video) {
        videoInfoSection.classList.remove('d-none');
        addTableRow(videoInfoTable, '编解码器', fileDetails.video.codec || '未知');
        addTableRow(videoInfoTable, '分辨率', fileDetails.video.resolution || '未知');
        addTableRow(videoInfoTable, '宽高比', fileDetails.video.aspectRatio || '未知');
        addTableRow(videoInfoTable, '帧率', fileDetails.video.frameRate || '未知');
        addTableRow(videoInfoTable, '视频比特率', fileDetails.video.bitrate || '未知');
      } else {
        videoInfoSection.classList.add('d-none');
      }

      // 填充音频信息
      if (fileDetails.audio) {
        audioInfoSection.classList.remove('d-none');
        addTableRow(audioInfoTable, '编解码器', fileDetails.audio.codec || '未知');
        addTableRow(audioInfoTable, '采样率', fileDetails.audio.sampleRate || '未知');
        addTableRow(audioInfoTable, '声道数', fileDetails.audio.channels || '未知');
        addTableRow(audioInfoTable, '音频比特率', fileDetails.audio.bitrate || '未知');
      } else {
        audioInfoSection.classList.add('d-none');
      }
    } else if (fileDetails.mediaInfo) {
      // 如果有mediaInfo字段但没有详细媒体信息，显示mediaInfo消息
      mediaInfoCard.classList.remove('d-none');
      mediaInfoGeneralTable.innerHTML = '';
      addTableRow(mediaInfoGeneralTable, '媒体信息', fileDetails.mediaInfo);
      videoInfoSection.classList.add('d-none');
      audioInfoSection.classList.add('d-none');
    } else {
      // 如果没有媒体信息，隐藏媒体信息卡片
      mediaInfoCard.classList.add('d-none');
    }

    // 处理媒体错误
    if (fileDetails.mediaError) {
      mediaInfoError.classList.remove('d-none');
      mediaInfoErrorText.textContent = fileDetails.mediaError;
    } else {
      mediaInfoError.classList.add('d-none');
    }

    // 隐藏加载中状态，显示内容
    fileDetailsLoading.classList.add('d-none');
    fileDetailsContent.classList.remove('d-none');

  } catch (error) {
    console.error('显示文件详情失败:', error);

    // 显示错误信息
    mediaInfoError.classList.remove('d-none');
    mediaInfoErrorText.textContent = `显示文件详情失败: ${ error.message }`;

    // 隐藏加载中状态，显示内容（虽然有错误）
    fileDetailsLoading.classList.add('d-none');
    fileDetailsContent.classList.remove('d-none');
  }
}

// 添加表格行
function addTableRow(tableBody, label, value) {
  const row = document.createElement('tr');

  const labelCell = document.createElement('th');
  labelCell.style.width = '30%';
  labelCell.textContent = label;

  const valueCell = document.createElement('td');
  valueCell.textContent = value;

  row.appendChild(labelCell);
  row.appendChild(valueCell);
  tableBody.appendChild(row);
}

// 收集当前文件夹中的所有图片和视频
function collectImagesInFolder(files) {
  // 清空当前图片和视频列表
  currentFolderImages = [];
  currentFolderVideos = [];

  // 定义文件类型扩展名
  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
  const videoExts = ["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv"];

  // 只收集非目录的媒体文件
  files.forEach((file) => {
    if (!file.isDirectory && !file.isParent) {
      const ext = file.name.split(".").pop().toLowerCase();

      // 收集图片
      if (imageExts.includes(ext)) {
        currentFolderImages.push(file);
      }

      // 收集视频
      if (videoExts.includes(ext)) {
        currentFolderVideos.push(file);
      }
    }
  });

  console.log(`收集到 ${ currentFolderImages.length } 张图片, ${ currentFolderVideos.length } 个视频`);
}

// 更新当前图片索引
function updateCurrentImageIndex(filePath) {
  // 查找当前图片在图片列表中的索引
  currentImageIndex = currentFolderImages.findIndex(img => img.path === filePath);
  console.log(`当前图片索引: ${ currentImageIndex }, 总图片数: ${ currentFolderImages.length }`);

  // 更新导航按钮状态
  updateImageNavigationButtons();
  // 设置图片标题
  if (currentImageIndex >= 0 && currentImageIndex < currentFolderImages.length && imageTitle) {
    imageTitle.textContent = currentFolderImages[currentImageIndex].name;
  }
}

// 显示上一张图片
function showPreviousImage() {
  if (currentFolderImages.length <= 1) return;

  // 计算上一张图片的索引（循环）
  let prevIndex = currentImageIndex - 1;
  if (prevIndex < 0) prevIndex = currentFolderImages.length - 1;

  // 显示上一张图片
  loadImage(currentFolderImages[prevIndex]);
}

// 显示下一张图片
function showNextImage() {
  if (currentFolderImages.length <= 1) return;

  // 计算下一张图片的索引（循环）
  let nextIndex = currentImageIndex + 1;
  if (nextIndex >= currentFolderImages.length) nextIndex = 0;

  // 显示下一张图片
  loadImage(currentFolderImages[nextIndex]);
}

// 更新图片导航按钮状态
function updateImageNavigationButtons() {
  // 如果只有一张或没有图片，隐藏导航按钮
  if (currentFolderImages.length <= 1) {
    if (prevImageBtn) prevImageBtn.style.display = 'none';
    if (nextImageBtn) nextImageBtn.style.display = 'none';
  } else {
    if (prevImageBtn) prevImageBtn.style.display = '';
    if (nextImageBtn) nextImageBtn.style.display = '';
  }
}

// 加载图片
function loadImage(file) {
  if (!file) return;

  try {
    console.log("加载图片:", file.path);

    // 标记图片正在加载
    imageLoadingInProgress = true;

    // 如果有正在进行的请求，中止它
    if (currentMediaRequest && currentMediaRequest.abort) {
      currentMediaRequest.abort();
    }

    // 创建一个可以被中止的请求
    const controller = new AbortController();
    const signal = controller.signal;
    currentMediaRequest = controller;

    // 请求图片内容
    fetch(`/api/file/content?path=${ encodeURIComponent(file.path) }`, {
      signal: signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${ response.status }`);
        }
        return response.json();
      })
      .then(data => {
        // 添加时间戳和随机数防止缓存
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const mediaUrl = `${ data.url }?t=${ timestamp }&r=${ randomStr }`;

        // 确保图片预览容器可见
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

          // 更新当前图片索引
          updateCurrentImageIndex(file.path);
        };

        // 图片加载失败处理
        fullscreenImage.onerror = (e) => {
          // 只有在图片仍在加载时才处理错误
          if (imageLoadingInProgress) {
            console.error("全屏图片加载失败:", e);
            // 标记为非加载状态
            imageLoadingInProgress = false;
            showCenteredMessage("图片加载失败", "error");
          }
        };

        // 设置图片源
        fullscreenImage.src = mediaUrl;

        // 清除当前请求引用
        currentMediaRequest = null;
      })
      .catch(error => {
        // 如果是中止请求导致的错误，不需要处理
        if (error.name === "AbortError") {
          console.log("媒体请求已被中止");
          return;
        }

        console.error("获取媒体文件内容失败:", error);
        imageLoadingInProgress = false; // 确保重置图片加载状态
        showCenteredMessage("加载图片失败", "error");
      });
  } catch (error) {
    console.error("加载图片失败:", error);
    imageLoadingInProgress = false;
    showCenteredMessage("加载图片失败", "error");
  }
}

// 更新当前视频索引
function updateCurrentVideoIndex(filePath) {
  // 查找当前视频在视频列表中的索引
  currentVideoIndex = currentFolderVideos.findIndex(video => video.path === filePath);
  console.log(`当前视频索引: ${ currentVideoIndex }, 总视频数: ${ currentFolderVideos.length }`);

  // 更新导航按钮状态
  updateVideoNavigationButtons();

  // 更新视频标题
  if (currentVideoIndex >= 0 && currentVideoIndex < currentFolderVideos.length) {
    videoTitle.textContent = currentFolderVideos[currentVideoIndex].name;
  }
}

// 显示上一个视频
function showPreviousVideo() {
  if (currentFolderVideos.length <= 1) return;

  // 计算上一个视频的索引（循环）
  let prevIndex = currentVideoIndex - 1;
  if (prevIndex < 0) prevIndex = currentFolderVideos.length - 1;

  // 显示上一个视频
  loadVideo(currentFolderVideos[prevIndex]);
}

// 显示下一个视频
function showNextVideo() {
  if (currentFolderVideos.length <= 1) return;

  // 计算下一个视频的索引（循环）
  let nextIndex = currentVideoIndex + 1;
  if (nextIndex >= currentFolderVideos.length) nextIndex = 0;

  // 显示下一个视频
  loadVideo(currentFolderVideos[nextIndex]);
}

// 更新视频导航按钮状态
function updateVideoNavigationButtons() {
  // 如果只有一个或没有视频，隐藏导航按钮
  if (currentFolderVideos.length <= 1) {
    if (prevVideoBtn) prevVideoBtn.style.display = 'none';
    if (nextVideoBtn) nextVideoBtn.style.display = 'none';
  } else {
    if (prevVideoBtn) prevVideoBtn.style.display = '';
    if (nextVideoBtn) nextVideoBtn.style.display = '';
  }
}

// 加载视频
function loadVideo(file) {
  if (!file) return;

  try {
    console.log("加载视频:", file.path);

    // 如果有正在进行的请求，中止它
    if (currentMediaRequest && currentMediaRequest.abort) {
      currentMediaRequest.abort();
    }

    // 创建一个可以被中止的请求
    const controller = new AbortController();
    const signal = controller.signal;
    currentMediaRequest = controller;

    // 请求视频内容
    fetch(`/api/file/content?path=${ encodeURIComponent(file.path) }`, {
      signal: signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${ response.status }`);
        }
        return response.json();
      })
      .then(data => {
        // 添加时间戳和随机数防止缓存
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const mediaUrl = `${ data.url }?t=${ timestamp }&r=${ randomStr }`;

        // 确保视频预览容器可见
        mediaPreviewOverlay.classList.remove("d-none");
        fullscreenVideoViewer.classList.remove("d-none");

        // 先清除旧的事件处理器
        fullscreenVideo.onerror = null;
        fullscreenVideo.onended = null;

        // 视频加载失败处理
        fullscreenVideo.onerror = (e) => {
          console.error("全屏视频加载失败:", e);
          showCenteredMessage("视频加载失败", "error");
        };

        // 视频加载结束事件
        fullscreenVideo.onended = () => {
          console.log("视频播放结束");
          // 可以选择自动播放下一个视频
          // showNextVideo();
        };

        // 设置视频源
        fullscreenVideo.src = mediaUrl;
        fullscreenVideo.type = data.mimeType;

        // 自动播放
        fullscreenVideo.play().catch((e) => {
          console.warn("自动播放失败:", e);
        });

        // 更新当前视频索引和标题
        updateCurrentVideoIndex(file.path);

        // 清除当前请求引用
        currentMediaRequest = null;
      })
      .catch(error => {
        // 如果是中止请求导致的错误，不需要处理
        if (error.name === "AbortError") {
          console.log("媒体请求已被中止");
          return;
        }

        console.error("获取媒体文件内容失败:", error);
        showCenteredMessage("加载视频失败", "error");
      });
  } catch (error) {
    console.error("加载视频失败:", error);
    showCenteredMessage("加载视频失败", "error");
  }
}
