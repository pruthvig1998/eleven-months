// Eleven Months extension: context menu on selected text, and the toolbar button opens the side panel.
// No network access: there are no host permissions, and nothing here fetches. activeTab lets it read only the tab
// the user right-clicked or opened the panel on, and only after that click.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'em-check', title: 'Check this clause with Eleven Months', contexts: ['selection'] });
  chrome.contextMenus.create({ id: 'em-page', title: 'Scan this page with Eleven Months', contexts: ['page'] });
});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'em-check' && info.menuItemId !== 'em-page') return;
  // sidePanel.open() needs the user gesture, so it runs first, before anything asynchronous.
  chrome.sidePanel.open({ windowId: tab ? tab.windowId : chrome.windows.WINDOW_ID_CURRENT }).catch(() => {});
  if (info.menuItemId === 'em-check') { chrome.storage.session.set({ pending: { text: info.selectionText || '', at: Date.now() } }); return; }
  // Whole page: the right-click grants activeTab for this tab only; the page text is read here, on the device.
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => (document.body ? document.body.innerText : '') })
    .then(r => chrome.storage.session.set({ pending: { text: (r && r[0] && r[0].result) || '', at: Date.now(), page: true } }))
    .catch(() => chrome.storage.session.set({ pending: { text: '', at: Date.now(), page: true, blocked: true } }));
});
