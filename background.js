// Placeholder for future background tasks
chrome.runtime.onInstalled.addListener(() => {
  console.log("PromptPilot installed.");
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
