var windowChatboxOpen = {};
var websocket;
var userId;
var shareMode;
var domainAllowSet;
var domainDenySet;

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
        refreshWebsocketConnection();
        // check if url not in allow array
        if (websocket != null || websocket != undefined) {
            console.log('tab url update hearbeat');
            console.log(userId);
            var data = {
                action: 'heartbeat',
                userId: userId,
                url: tab.url,
                title: tab.title,
                eventType: 'update-presence'
            };
            console.log(data);
            websocket.send(JSON.stringify(data));
        }
    }
});

// when the tab on a window is changed
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab) {
            chrome.tabs.sendMessage(activeInfo.tabId, {
                type: 'change-tab',
                tabId: tab.id,
                tabUrl: tab.url,
                tabTitle: tab.title,
                tabWindowId: tab.windowId
            });
            refreshWebsocketConnection();
            if (websocket != null || websocket != undefined) {
                console.log('tab change heartbeat');
                console.log(userId);
                var data = {
                    action: 'heartbeat',
                    userId: userId,
                    url: tab.url,
                    title: tab.title,
                    eventType: 'update-presence'
                };
                console.log(data);
                websocket.send(JSON.stringify(data));
            }
        }
    });
});

// when window focus is changed
// chrome.windows.onFocusChanged.addListener(function(windowId) {
//     if (windowId !== -1) { 
//         const queryInfo = {
//             windowId: windowId,
//             highlighted: true,
//             active: true,
//             windowType: 'normal',
//             currentWindow: true
//         };
//         chrome.tabs.query(queryInfo, tabs => {
//             if (tabs.length === 1) {
//                 chrome.tabs.sendMessage(tabs[0].id, {
//                     type: 'change-window',
//                     tabId: tabs[0].id,
//                     tabUrl: tabs[0].url,
//                     tabTitle: tabs[0].title,
//                     tabWindowId: tabs[0].windowId
//                 });
//             }        
//         }); 
//     }
// });

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
        switch (request.type) {
            case 'google-auth-session':
                chrome.storage.local.set({ 'google-auth-session': request.data });
                sendResponse({ code: 'success' });
                break;
            case 'window-chatbox-close':
                var chatWindowOpenKey = 'windowChatboxOpen_' + sender.tab.windowId;
                chrome.storage.local.get(chatWindowOpenKey, function(item) {
                    if (item) {
                        chrome.storage.local.remove(chatWindowOpenKey);
                    }
                });
                break;
            // case 'update-user-info':
            //     console.log('update-user-info runtime message');
            //     console.log(request.data);
            //     shareMode = request.data.shareMode;
            //     domainAllowSet = request.data.domainAllowSet;
            //     domainDenySet = request.data.domainDenySet;
            //     userId = request.data.userId;
            //     break;
            default:
                console.log("Request type " + request.type + " not found");
                break;
        }
    }
);

// Listen for runtime messages
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(request);
        switch (request.type) {
            case 'auth-jwt':
                chrome.storage.local.set({ 'auth-jwt': request.data });
                sendResponse({ code: 'success' });
                break;
            case 'connect-websocket':
                connectWebsocket();
                break;
            case 'disconnect-websocket':
                disconnectWebsocket();
                break;
            case 'websocket-status':
                var status = getWebsocketStatus();
                sendResponse({ status: status });
                break;
            case 'heartbeat':
                
                break;
            case 'update-user-info':
                console.log('update-user-info runtime message');
                console.log(request.data);
                shareMode = request.data.shareMode;
                domainAllowSet = request.data.domainAllowSet;
                domainDenySet = request.data.domainDenySet;
                userId = request.data.userId;
                break;
            default:
                console.log("Request type " + request.type + " not found");
        }
    }
);

function connectWebsocket() {
    const wsHost = 'wss://78j9teq8m9.execute-api.us-west-2.amazonaws.com/dev/';
    if (websocket == null | websocket == undefined) {
        try {
            chrome.storage.local.get('auth-jwt', function(item) {
                if (item && item['auth-jwt']) {
                    websocket = new WebSocket(`${wsHost}?Authorization=${item['auth-jwt']}`);
                    console.log('Connected to', websocket);
                    websocket.onmessage = function (event) {
                        var data = JSON.parse(event.data);
                        console.log(data);
                        switch (data.type) {
                            case 'update-presence':
                                chrome.runtime.sendMessage({
                                    type: 'update-presence',
                                    data: {
                                        userId: data.userId,
                                        url: data.url,
                                        title: data.title
                                    }
                                });
                                
                                break;
                            default:
                                console.log("Event type " + data.type + " not found");
                        }
                    }
                    websocket.onclose = function() {
                        console.log('Websocket closed');
                        websocket = undefined;
                    }
                } else {
                    console.log("JWT is missing");
                }
            });
        } catch (error) {
            console.log(error);
        }
    } else {
        console.log('Already connected to', websocket);
    }
}

function refreshWebsocketConnection() {
    if (websocket == null || websocket == undefined) {
        connectWebsocket();
    } else {
        if (websocket.readyState != WebSocket.OPEN && websocket.readyState != WebSocket.CONNECTING) {
            websocket = undefined;
            connectWebsocket();
        }
    }
}

function disconnectWebsocket() {
    if (websocket != null || websocket != undefined) {
        console.log('Closing', websocket);
        websocket.close();
        websocket = undefined;
    } else {
        console.log('Websocket is already closed');
    }
}

function getWebsocketStatus() {
    if (websocket == null || websocket == undefined) {
        return -1;
    } else {
        return websocket.readyState;
    }
}

// TODO: set everything to false when disconnect?