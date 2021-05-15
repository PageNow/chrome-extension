var windowChatboxOpen = {};

// when the tab url is updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tab.id, {
            type: 'update-tab',
            tabId: tab.id,
            tabUrl: tab.url,
            tabTitle: tab.title,
            tabWindowId: tab.windowId
        });
    }
});

// when the tab on a window is changed
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, tab => {
        chrome.tabs.sendMessage(activeInfo.tabId, {
            type: 'change-tab',
            tabId: tab.id,
            tabUrl: tab.url,
            tabTitle: tab.title,
            tabWindowId: tab.windowId
        });
    });
});

// when window focus is changed
chrome.windows.onFocusChanged.addListener(function(windowId) {
    if (windowId !== -1) { 
        const queryInfo = {
            windowId: windowId,
            highlighted: true,
            active: true,
            windowType: 'normal',
            currentWindow: true
        };
        chrome.tabs.query(queryInfo, tabs => {
            if (tabs.length === 1) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'change-window',
                    tabId: tabs[0].id,
                    tabUrl: tabs[0].url,
                    tabTitle: tabs[0].title,
                    tabWindowId: tabs[0].windowId
                });
            }        
        }); 
    }
});

// on window close => remove chrome storage key/value pair
chrome.windows.onRemoved.addListener(function(windowId) {
    chrome.storage.local.remove('windowChatboxOpen_' + windowId);
});

// when a new window is opened, clean up the storage
// opening window is not a very frequent event
chrome.windows.onCreated.addListener(function(windowId) {
    var item = {};
    item['windowChatboxOpen_' + windowId] = false;
    chrome.storage.local.set(item);
    // clean up unused variables
    chrome.storage.local.get(null, function(items) {
        var windowIdKeyArr = [];
        chrome.windows.getAll({}, function(windowArr) {
            for(var i=0; i < windowArr.length; i++) {
                windowIdKeyArr.push('windowChatboxOpen_' + windowArr[i].id);
            }
            for (var prop in items) {
                if (prop.startsWith('windowChatboxOpen_') && 
                        !windowIdKeyArr.includes(prop)) {
                    chrome.storage.local.remove(prop);
                }
            }
        });
    });
});

//Listen for incoming external messages.
chrome.runtime.onMessageExternal.addListener(
    function (request, sender, sendResponse) {
        if (request.type === 'google-auth-session') {
            chrome.storage.local.set({ 'google-auth-session': request.data });
        }
    });

// TODO: set everything to false when disconnect?