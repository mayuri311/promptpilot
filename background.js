chrome.runtime.onInstalled.addListener(() => {
  console.log("PromptPilot installed.");
});

chrome.action.onClicked.addListener((tab) => {
  console.log("Icon clicked on tab:", tab);

  chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: 'sidepanel.html',
    enabled: true
  });

  chrome.sidePanel.open({ tabId: tab.id }).catch((e) => {
    console.error(" Failed to open side panel:", e);
  });
});

// listen for tab switches or updates
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  chrome.storage.local.set({ currentSite: tab.url });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.set({ currentSite: tab.url });
  }
});