const styleLink = document.createElement('link');
styleLink.href = chrome.runtime.getURL('styles/content.css');
styleLink.rel = 'stylesheet';
document.head.appendChild(styleLink);

let isSelecting = false;
let currentSelection = null;
let isMouseDown = false;

// 点击页面其他地方时隐藏按钮
document.addEventListener('mousedown', function(e) {
  if (e.target.id !== 'text-selector-floating') {
    const floatingButton = document.getElementById('text-selector-floating');
    if (floatingButton) {
      floatingButton.style.display = 'none';
    }
  }
});

// 监听来自background的状态更新
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'UPDATE_SELECTION_STATE') {
    isSelecting = request.enabled;
  }
});

// 监听选区变化事件
document.addEventListener('selectionchange', () => {
  // 移除已存在的按钮，避免重复创建
  const existingBtn = document.getElementById('text-selector-floating');
  if (existingBtn) {
    existingBtn.remove();
  }
});

// 修改点击保存按钮事件
document.addEventListener('mouseup', function(e) {
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    // 移除已存在的按钮
    const existingBtn = document.getElementById('text-selector-floating');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    if (selectedText && selectedText.length > 0) {
      // 获取选区位置
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // 在选区附近创建按钮
      const floatingButton = document.createElement('div');
      floatingButton.id = 'text-selector-floating';
      floatingButton.style.cssText = `
        position: absolute;
        z-index: 2147483647;
        padding: 4px 8px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        line-height: 1;
        transition: all 0.2s ease;
        user-select: none;
        pointer-events: auto;
        white-space: nowrap;
      `;
      floatingButton.textContent = '保存选中文本';
      
      // 设置按钮位置在选区右侧
      const left = rect.right + window.scrollX + 5;
      const top = rect.top + window.scrollY - 10;
      
      // 确保按钮不会超出屏幕边界
      const buttonWidth = 100; // 估计按钮宽度
      const buttonHeight = 30; // 估计按钮高度
      
      floatingButton.style.left = `${Math.min(left, window.innerWidth - buttonWidth)}px`;
      floatingButton.style.top = `${Math.min(top, window.innerHeight - buttonHeight)}px`;
      
      // 添加鼠标悬停效果
      floatingButton.onmouseover = () => {
        floatingButton.style.background = '#45a049';
        floatingButton.style.transform = 'translateY(-1px)';
      };
      
      floatingButton.onmouseout = () => {
        floatingButton.style.background = '#4CAF50';
        floatingButton.style.transform = 'translateY(0)';
      };

      // 修改点击保存按钮事件
      floatingButton.onclick = function(event) {
        event.stopPropagation();
        
        // 立即隐藏按钮
        floatingButton.style.display = 'none';
        
        chrome.storage.local.get(['savedSelections'], function(result) {
          const savedSelections = result.savedSelections || [];
          savedSelections.push({
            content: selectedText,
            timestamp: new Date().toISOString(),
            url: window.location.href
          });
          
          chrome.storage.local.set({ savedSelections }, function() {
            showSavedNotification();
            // 清除选中的文本
            window.getSelection().removeAllRanges();
          });
        });
      };
      
      document.body.appendChild(floatingButton);
    }
  }, 10);
});

// 清理选区的函数
function clearSelection() {
  if (currentSelection) {
    window.getSelection().removeAllRanges();
    currentSelection = null;
  }
}

// 点击页面其他地方时清除浮动按钮
document.addEventListener('click', (e) => {
  const floatingBtn = document.getElementById('text-selector-floating');
  if (floatingBtn && !floatingBtn.contains(e.target)) {
    floatingBtn.remove();
    clearSelection();
  }
});

// 添加调试代码
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request);
  sendResponse('收到');
});

// 发送保存请求到后台
function saveSelection(content) {
  chrome.runtime.sendMessage(
    { type: 'SAVE_SELECTION', content },
    (response) => {
      if (!response?.success) {
        console.error('保存失败:', response?.error || '未知错误');
      }
    }
  );
}

// 在现有的选区处理逻辑中调用保存
function handleSelection() {
  const selection = window.getSelection().toString().trim();
  if (selection) {
    saveSelection(selection);
    // ... existing clear selection logic ...
  }
}

// 添加保存成功的提示
function showSavedNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    animation: fadeInOut 2s ease-in-out forwards;
  `;
  notification.textContent = '文本已保存';
  document.body.appendChild(notification);

  // 2秒后移除提示
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 2000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
    80% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
`;
document.head.appendChild(style);
