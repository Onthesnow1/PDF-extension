const styleLink = document.createElement('link');
styleLink.href = chrome.runtime.getURL('styles/content.css');
styleLink.rel = 'stylesheet';
document.head.appendChild(styleLink);

let isSelecting = false;
let currentSelection = null;
let isMouseDown = false;

// 创建浮动按钮
const createFloatingButton = (x, y) => {
  let floatingButton = document.getElementById('text-selector-floating');
  if (!floatingButton) {
    floatingButton = document.createElement('div');
    floatingButton.id = 'text-selector-floating';
    floatingButton.style.cssText = `
      position: fixed;
      background: #4CAF50;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 999999999;
      font-size: 14px;
      user-select: none;
      display: none;
    `;
    floatingButton.textContent = '保存选中文本';
    document.body.appendChild(floatingButton);
  }

  // 计算位置，确保按钮在视窗内
  const buttonWidth = 100; // 估计按钮宽度
  const buttonHeight = 36; // 估计按钮高度
  
  // 确保按钮不会超出屏幕右边界
  let left = Math.min(x, window.innerWidth - buttonWidth);
  // 确保按钮不会超出屏幕底部
  let top = Math.min(y, window.innerHeight - buttonHeight);
  
  floatingButton.style.left = `${left}px`;
  floatingButton.style.top = `${top}px`;
  floatingButton.style.display = 'block';
  
  return floatingButton;
};

// 监听来自background的状态更新
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'UPDATE_SELECTION_STATE') {
    isSelecting = request.enabled;
  }
});

// 监听选区变化事件
document.addEventListener('selectionchange', () => {
  if (!isSelecting) return;
  
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  // 移除已存在的按钮
  const existingBtn = document.getElementById('text-selector-floating');
  if (existingBtn) {
    existingBtn.remove();
  }
  
  if (selectedText) {
    const btn = createSaveButton();
    
    // 获取选区位置
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    const left = rect.right + window.scrollX;
    const top = rect.top + window.scrollY - 30;
    
    btn.style.position = 'absolute';
    btn.style.left = `${left}px`;
    btn.style.top = `${top}px`;
    
    // 修改按钮点击事件处理
    btn.onclick = async () => {
      try {
        // 保存选中内容
        await saveSelection(selectedText);
        
        // 更新popup显示
        await chrome.runtime.sendMessage({
          type: 'NEW_SELECTION',
          content: selectedText
        });
        
        // 显示保存成功的视觉反馈
        btn.style.background = '#45a049';
        btn.textContent = '已保存';
        
        // 1秒后移除按钮
        setTimeout(() => {
          btn.remove();
        }, 1000);
        
        // 输出调试信息
        console.log('内容已保存:', selectedText);
        
      } catch (error) {
        console.error('保存失败:', error);
        btn.style.background = '#f44336';
        btn.textContent = '保存失败';
      }
    };
    
    document.body.appendChild(btn);
  }
});

// 修改createSaveButton函数，使按钮更加紧凑
function createSaveButton() {
  const button = document.createElement('button');
  button.id = 'text-selector-floating';
  button.textContent = '保存';
  button.style.cssText = `
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
  
  button.onmouseover = () => {
    button.style.background = '#45a049';
    button.style.transform = 'translateY(-1px)';
  };
  
  button.onmouseout = () => {
    button.style.background = '#4CAF50';
    button.style.transform = 'translateY(0)';
  };
  
  return button;
}

// 移除之前的mousedown、mousemove事件监听器，只保留必要的清理逻辑
document.addEventListener('mousedown', (e) => {
  if (!isSelecting) return;
  
  // 点击非按钮区域时清除已有按钮
  const existingBtn = document.getElementById('text-selector-floating');
  if (existingBtn && !existingBtn.contains(e.target)) {
    existingBtn.remove();
  }
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

// 修改点击保存按钮事件
document.addEventListener('mouseup', function(e) {
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      const floatingButton = createFloatingButton(
        e.clientX + window.scrollX,
        e.clientY + window.scrollY - 40
      );

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
    }
  }, 10);
});

// 点击页面其他地方时隐藏按钮
document.addEventListener('mousedown', function(e) {
  if (e.target.id !== 'text-selector-floating') {
    const floatingButton = document.getElementById('text-selector-floating');
    if (floatingButton) {
      floatingButton.style.display = 'none';
    }
  }
});

// 添加保存成功的提示
function showSavedNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 10000;
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
    0% { opacity: 0; transform: translateY(20px); }
    20% { opacity: 1; transform: translateY(0); }
    80% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
`;
document.head.appendChild(style);
