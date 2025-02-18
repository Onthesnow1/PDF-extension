// 默认开启划词模式
let selectionEnabled = true;

// 初始化存储
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['savedSelections'], (result) => {
    if (!result.savedSelections) {
      chrome.storage.local.set({ savedSelections: [] });
    }
  });
});

// 当新标签页打开时，发送启用状态
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.sendMessage(activeInfo.tabId, {
    type: 'UPDATE_SELECTION_STATE',
    enabled: true
  });
});

// 消息处理中心
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SELECTION_STATE') {
    sendResponse(true);
    return true;
  }
  
  if (request.type === 'SAVE_SELECTION') {
    chrome.storage.local.get(['savedSelections'], (result) => {
      const savedSelections = result.savedSelections || [];
      const newSelection = {
        content: request.content,
        timestamp: new Date().toISOString()
      };
      
      // 添加新内容并保存
      const updatedSelections = [...savedSelections, newSelection];
      chrome.storage.local.set({ savedSelections: updatedSelections }, () => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError });
        } else {
          sendResponse({ success: true });
        }
      });
    });
    return true; // 保持消息通道开放用于异步响应
  }

  if (request.type === 'DELETE_SELECTION') {
    chrome.storage.local.get(['savedSelections'], (result) => {
      const updated = result.savedSelections.filter((_, i) => i !== request.index);
      chrome.storage.local.set({ savedSelections: updated }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
