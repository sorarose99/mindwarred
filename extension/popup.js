// Kiro Web Mind - Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Kiro popup loaded');
  
  // Initialize popup
  await initializePopup();
  
  // Set up event listeners
  setupEventListeners();
});

async function initializePopup() {
  try {
    // Load settings
    const settings = await chrome.storage.sync.get([
      'kiroEnabled',
      'privacyLevel',
      'sidebarPosition'
    ]);
    
    // Update toggle state
    const toggle = document.getElementById('kiro-toggle');
    const statusIndicator = document.getElementById('status-indicator');
    
    if (settings.kiroEnabled !== false) {
      toggle.classList.add('active');
      statusIndicator.textContent = 'active';
    } else {
      toggle.classList.remove('active');
      statusIndicator.textContent = 'inactive';
    }
    
    // Load stats
    await loadStats();
    
  } catch (error) {
    console.error('Popup initialization error:', error);
  }
}

async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['activities', 'stats']);
    const activities = result.activities || [];
    const stats = result.stats || { pagesAnalyzed: 0, suggestionsMade: 0 };
    
    // Update display
    document.getElementById('pages-analyzed').textContent = stats.pagesAnalyzed || activities.length;
    document.getElementById('suggestions-made').textContent = stats.suggestionsMade || 0;
    
  } catch (error) {
    console.error('Stats loading error:', error);
  }
}

function setupEventListeners() {
  // Toggle Kiro on/off
  document.getElementById('kiro-toggle').addEventListener('click', async () => {
    try {
      const settings = await chrome.storage.sync.get(['kiroEnabled']);
      const newState = !settings.kiroEnabled;
      
      await chrome.storage.sync.set({ kiroEnabled: newState });
      
      const toggle = document.getElementById('kiro-toggle');
      const statusIndicator = document.getElementById('status-indicator');
      
      if (newState) {
        toggle.classList.add('active');
        statusIndicator.textContent = 'active';
      } else {
        toggle.classList.remove('active');
        statusIndicator.textContent = 'inactive';
      }
      
      // Notify content scripts
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'KIRO_STATE_CHANGED',
          enabled: newState
        }).catch(() => {
          // Content script might not be loaded yet
        });
      }
      
    } catch (error) {
      console.error('Toggle error:', error);
    }
  });
  
  // Summarize page
  document.getElementById('summarize-page').addEventListener('click', async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SUMMARIZE_PAGE'
        });
        
        if (response && response.success) {
          showNotification('Page summarized successfully!');
        } else {
          showNotification('Unable to summarize page', 'error');
        }
      }
    } catch (error) {
      console.error('Summarize error:', error);
      showNotification('Error summarizing page', 'error');
    }
  });
  
  // Analyze content
  document.getElementById('analyze-content').addEventListener('click', async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'ANALYZE_CONTENT'
        });
        
        if (response && response.success) {
          showNotification('Content analyzed successfully!');
        } else {
          showNotification('Unable to analyze content', 'error');
        }
      }
    } catch (error) {
      console.error('Analyze error:', error);
      showNotification('Error analyzing content', 'error');
    }
  });
  
  // Show insights
  document.getElementById('show-insights').addEventListener('click', async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SHOW_INSIGHTS'
        });
        
        if (response && response.success) {
          showNotification('Insights displayed!');
        } else {
          showNotification('No insights available', 'warning');
        }
      }
    } catch (error) {
      console.error('Insights error:', error);
      showNotification('Error showing insights', 'error');
    }
  });
  
  // Open dashboard
  document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
    window.close();
  });
}

function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    padding: 8px 12px;
    background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
    color: white;
    border-radius: 6px;
    font-size: 12px;
    z-index: 1000;
    animation: slideDown 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);