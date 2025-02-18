document.addEventListener('DOMContentLoaded', () => {
  const contentDiv = document.getElementById('selectedContent');

  // 隐藏不需要的元素
  if (document.getElementById('status')) {
    document.getElementById('status').style.display = 'none';
  }
  if (document.getElementById('toggleSelection')) {
    document.getElementById('toggleSelection').style.display = 'none';
  }

  // 新增：创建内容容器
  const createContentItem = (text, timestamp, index) => {
    const div = document.createElement('div');
    div.className = 'content-item';
    div.innerHTML = `
      <div class="content-text">${text}</div>
      <div class="content-meta">
        <span class="content-time">${new Date(timestamp).toLocaleString()}</span>
        <button class="delete-btn" data-index="${index}">×</button>
      </div>
    `;
    return div;
  };

  // 增强版加载内容
  function loadSavedContent() {
    chrome.storage.local.get(['savedSelections'], (result) => {
      contentDiv.innerHTML = ''; // 清空旧内容
      
      if (result.savedSelections?.length) {
        result.savedSelections
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // 按时间倒序
          .forEach(item => {
            contentDiv.appendChild(createContentItem(item.content, item.timestamp, result.savedSelections.indexOf(item)));
          });
      } else {
        contentDiv.textContent = '暂无保存内容';
      }
    });
  }

  // 新增：实时监听存储变化
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.savedSelections) {
      loadSavedContent();
    }
  });

  // 初始化加载
  loadSavedContent();

  // 监听内容更新
  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === 'CONTENT_UPDATED') {
      updateContentDisplay(request.selections);
    }
  });

  function updateContentDisplay(selections) {
    // 清空现有内容
    contentDiv.innerHTML = '';
    
    if (selections.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = '还没有保存的内容';
      emptyMessage.style.cssText = `
        padding: 20px;
        text-align: center;
        color: #666;
        font-style: italic;
      `;
      contentDiv.appendChild(emptyMessage);
      return;
    }

    // 显示所有保存的内容
    selections.forEach((item, index) => {
      const entry = document.createElement('div');
      entry.className = 'content-entry';
      
      // 创建内容容器
      const contentText = document.createElement('div');
      contentText.className = 'content-text';
      contentText.textContent = item.content;
      
      // 创建删除按钮
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '删除';
      deleteBtn.onclick = () => deleteEntry(index);
      
      // 设置样式
      entry.style.cssText = `
        padding: 10px;
        margin: 8px 0;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        background: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      contentText.style.cssText = `
        flex: 1;
        margin-right: 10px;
        word-break: break-all;
      `;
      
      deleteBtn.style.cssText = `
        padding: 4px 8px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      `;
      
      entry.appendChild(contentText);
      entry.appendChild(deleteBtn);
      contentDiv.appendChild(entry);
    });
  }

  function deleteEntry(index) {
    chrome.storage.local.get(['savedSelections'], (result) => {
      const updated = result.savedSelections.filter((_, i) => i !== index);
      chrome.storage.local.set({ savedSelections: updated });
    });
  }

  // 在loadSavedContent中添加事件委托
  contentDiv.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const index = parseInt(e.target.dataset.index);
      deleteEntry(index);
    }
  });
}); 