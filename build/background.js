var windowChatboxOpen = {};
var websocket;
var userId;
var shareMode = 'default_none';
var domainAllowSet = new Set([]);
var domainDenySet = new Set([]);
var jwt;

chrome.alarms.create('pagenow-heartbeat', {
    delayInMinutes: 1,
    periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'pagenow-heartbeat') {
        console.log('heartbeat alarm');
        if (websocket != null || websocket != undefined) {
            console.log('sending heartbeat to server');
            websocket.send(JSON.stringify({
                action: 'heartbeat',
                jwt: jwt,
            }));
        }
    }
});

// when the tab url is updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        sendPresenceWebsocket(tab.url, tab.title);
    }
});

// when the tab on a window is changed
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab) {
            sendPresenceWebsocket(tab.url, tab.title);
        }
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
                sendPresenceWebsocket(tabs[0].url, tabs[0].title);
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
            case 'update-user-info':
                shareMode = request.data.shareMode;
                domainAllowSet = request.data.domainAllowSet;
                domainDenySet = request.data.domainDenySet;
                userId = request.data.userId;
                break;
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
                jwt = request.data;
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
            case 'update-user-info':
                shareMode = request.data.shareMode;
                domainAllowSet = new Set(request.data.domainAllowSet);
                domainDenySet = new Set(request.data.domainDenySet);
                userId = request.data.userId;
                break;
            default:
                console.log("Request type " + request.type + " not found");
        }
    }
);

function connectWebsocket() {
    const wsHost = 'wss://io6oef1762.execute-api.us-west-2.amazonaws.com/dev/';
    if (websocket === null | websocket === undefined) {
        try {
            if (jwt !== null && jwt !== undefined) {
                websocket = new WebSocket(`${wsHost}?Authorization=${jwt}`);
                console.log('Connected to the websocket');
                websocket.onmessage = function (event) {
                    var data = JSON.parse(event.data);
                    switch (data.type) {
                        case 'update-presence':
                            chrome.tabs.query({}, function(tabs) {
                                var message = {
                                    type: 'update-presence',
                                    userId: data.userId,
                                    url: data.url,
                                    title: data.title
                                }
                                for (var i = 0; i < tabs.length; i++) {
                                    chrome.tabs.sendMessage(tabs[i].id, message);
                                }
                            });
                            break;
                        default:
                            console.log("Event type " + data.type + " not found");
                            console.log(data);
                    }
                }
                websocket.onclose = function() {
                    console.log('Websocket closed');
                    websocket = undefined;
                }
            } else {
                console.log("Missing jwt");
            }
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
        if (websocket.readyState !== WebSocket.OPEN && websocket.readyState !== WebSocket.CONNECTING) {
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

function sendPresenceWebsocket(url, title) {
    url = new URL(url);
    var updatedUrl = '';
    var updatedTitle = '';
    if ((shareMode == 'default_none' && domainAllowSet.has(url.hostname)) ||
        (shareMode == 'default_all' && !domainDenySet.has(url.hostname))) {
        updatedUrl = url;
        updatedTitle = title;
    }
    refreshWebsocketConnection();
    if (websocket !== null && websocket !== undefined && websocket.readyState === WebSocket.OPEN) {
        var data = {
            action: 'update-presence',
            url: updatedUrl,
            title: updatedTitle,
            jwt: jwt
        };
        console.log('Sending ws message for url ' + url);
        websocket.send(JSON.stringify(data));
    }
}

// TODO: set everything to false when disconnect?