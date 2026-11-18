// Eleven Months extension: context menu on selected text, and the toolbar button opens the side panel.
// No network access: there are no host permissions, and nothing here fetches.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'em-check', title: 'Check this clause with Eleven Months', contexts: ['selection'] });
});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'em-check') return;
  // sidePanel.open() needs the user gesture, so it runs first, before anything asynchronous.
  chrome.sidePanel.open({ windowId: tab ? tab.windowId : chrome.windows.WINDOW_ID_CURRENT }).catch(() => {});
  chrome.storage.session.set({ pending: { text: info.selectionText || '', at: Date.now() } });
});
