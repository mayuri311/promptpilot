// Placeholder for future background tasks
chrome.runtime.onInstalled.addListener(() => {
  console.log("PromptPilot installed.");
});
chrome.action.onClicked.addListener(async () => {
  try {
    await chrome.sidePanel.setOptions({
      path: 'sidepanel.html',
      enabled: true
    });
    await chrome.sidePanel.open({});
  } catch (e) {
    console.error('Failed to open side panel:', e);
  }
});