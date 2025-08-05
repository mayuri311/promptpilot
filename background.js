// PromptCraft Background Script - Resilient Version
let isInitialized = false;

// Safe initialization
chrome.runtime.onInstalled.addListener(() => {
  if (isInitialized) return;
  
  console.log('PromptCraft extension installed');
  
  try {
    // Set default settings with error handling
    chrome.storage.sync.set({
      enabled: true,
      stats: {
        promptsAnalyzed: 0,
        suggestionsMade: 0,
        improvements: 0
      }
    }).catch(error => {
      console.warn('PromptCraft storage init error:', error);
    });
    
    isInitialized = true;
  } catch (error) {
    console.error('PromptCraft installation error:', error);
  }
});

// Handle messages with better error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (!request || !request.action) {
      sendResponse({ error: 'Invalid request' });
      return false;
    }

    if (request.action === 'updateStats') {
      chrome.storage.sync.get(['stats']).then(result => {
        const stats = result.stats || {
          promptsAnalyzed: 0,
          suggestionsMade: 0,
          improvements: 0
        };
        
        stats.promptsAnalyzed += request.promptsAnalyzed || 0;
        stats.suggestionsMade += request.suggestionsMade || 0;
        stats.improvements = Math.min(stats.improvements + (request.improvements || 0), 100);
        
        return chrome.storage.sync.set({ stats });
      }).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        console.warn('PromptCraft stats update error:', error);
        sendResponse({ error: error.message });
      });
      
      return true; // Keep message channel open for async response
    }
    
    if (request.action === 'getSettings') {
      chrome.storage.sync.get(['enabled', 'stats']).then(result => {
        sendResponse({
          enabled: result.enabled !== false,
          stats: result.stats || { promptsAnalyzed: 0, suggestionsMade: 0, improvements: 0 }
        });
      }).catch(error => {
        console.warn('PromptCraft settings get error:', error);
        sendResponse({
          enabled: true,
          stats: { promptsAnalyzed: 0, suggestionsMade: 0, improvements: 0 }
        });
      });
      
      return true; // Keep message channel open for async response
    }
    
    sendResponse({ error: 'Unknown action' });
    return false;
    
  } catch (error) {
    console.error('PromptCraft message handler error:', error);
    sendResponse({ error: error.message });
    return false;
  }
});

// Update badge with error handling
chrome.tabs.onActivated.addListener((activeInfo) => {
  try {
    chrome.tabs.get(activeInfo.tabId).then(tab => {
      if (tab && tab.url && isAISite(tab.url)) {
        chrome.action.setBadgeText({ text: 'ON', tabId: tab.id }).catch(error => {
          console.warn('PromptCraft badge set error:', error);
        });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' }).catch(error => {
          console.warn('PromptCraft badge color error:', error);
        });
      } else {
        chrome.action.setBadgeText({ text: '', tabId: tab.id }).catch(error => {
          console.warn('PromptCraft badge clear error:', error);
        });
      }
    }).catch(error => {
      console.warn('PromptCraft tab get error:', error);
    });
  } catch (error) {
    console.error('PromptCraft tab activation error:', error);
  }
});

// Handle startup
chrome.runtime.onStartup.addListener(() => {
  try {
    console.log('PromptCraft extension started');
    isInitialized = false; // Reset initialization flag
  } catch (error) {
    console.error('PromptCraft startup error:', error);
  }
});

// Handle context invalidation
chrome.runtime.onSuspend.addListener(() => {
  try {
    console.log('PromptCraft extension suspended');
  } catch (error) {
    console.error('PromptCraft suspend error:', error);
  }
});

function isAISite(url) {
  try {
    const aiSites = [
      'chat.openai.com',
      'claude.ai',
      'bard.google.com',
      'perplexity.ai',
      'you.com',
      'poe.com'
    ];
    
    return aiSites.some(site => url.includes(site));
  } catch (error) {
    console.warn('PromptCraft URL check error:', error);
    return false;
  }
}