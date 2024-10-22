chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({ url: chrome.runtime.getURL("options.html") }, (tabs) => {
    if (tabs.length > 0) {
      // 如果已经打开了 options.html，则激活该标签页
      chrome.tabs.update(tabs[0].id, { active: true });
    } else {
      // 否则，打开新的 options.html 标签页
      chrome.runtime.openOptionsPage();
    }
  });
});
