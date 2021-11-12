var presenceWsHost = 'wss://c36ut4t8oh.execute-api.us-west-2.amazonaws.com/prod/';
var chatWsHost = 'wss://rlz53bbvnb.execute-api.us-west-2.amazonaws.com/prod/';

var presenceWebsocket;
var chatWebsocket;

var windowChatboxOpen = {};
var shareMode = 'default_none';
var domainAllowSet = new Set([]);
var domainDenySet = new Set([]);
var jwt;

var currUrl;
var currDomain;

connectPresenceWebsocket();
connectChatWebsocket();

// Send presence heartbeat every minute.
// The user is considered offline if the status is not updated for 3 minutes.
chrome.alarms.create('presence-heartbeat', {
    delayInMinutes: 1,
    periodInMinutes: 1
});
// Send chat heartbeat every 5 minutes.
// AWS API Gateway websocket closes automatically if it is idle for 10 minutes.
chrome.alarms.create('chat-heartbeat', {
    delayInMinutes: 5,
    periodInMinutes: 5,
});

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'presence-heartbeat') {
        refreshPresenceWebsocketConnection();
        if (presenceWebsocket !== null && presenceWebsocket !== undefined
                && presenceWebsocket.readyState === WebSocket.OPEN) {
            presenceWebsocket.send(JSON.stringify({
                action: 'heartbeat'
            }));
        }
    } else if (alarm.name === 'chat-heartbeat') {
        refreshChatWebsocketConnection();
        if (chatWebsocket !== null && chatWebsocket !== undefined
                && chatWebsocket.readyState === WebSocket.OPEN) {
            chatWebsocket.send(JSON.stringify({
                action: 'heartbeat'
            }));
        }
    }
});

// when the tab url is updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    chrome.windows.get(tab.windowId, function(window) {
        // check if the tab is highlighed and the window is focused
        if (changeInfo.status === 'complete' && tab.highlighted && window.focused) {
            updateCurrDomain(tab.url);
            sendPresenceWebsocket(tab.url, tab.title);
        }
    });
});

// when the tab on a window is changed
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab) {
            updateCurrDomain(tab.url);
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
                updateCurrDomain(tabs[0].url);
            }        
        }); 
    }
});

// on window close => remove chrome storage key/value pair
chrome.windows.onRemoved.addListener(function(windowId) {
    chrome.storage.local.remove('windowChatboxOpen_' + windowId);
    chrome.storage.local.remove('windowChatboxWidth_' + windowId);
    chrome.storage.local.remove('windowChatboxHeight_' + windowId);
});

// when a new window is opened, clean up the storage
// opening window is not a very frequent event
chrome.windows.onCreated.addListener(function(window) {
    chrome.storage.local.set({
        ['windowChatboxOpen_' + window.id]: false,
        ['windowChatboxWidth_' + window.id]: '400px',
        ['windowChatboxHeight_' + window.id]: '500px'
    });
    // clean up unused variables
    chrome.storage.local.get(null, function(items) {
        var windowIdKeyArr = [];
        chrome.windows.getAll({}, function(windowArr) {
            for (var i = 0; i < windowArr.length; i++) {
                windowIdKeyArr.push('windowChatboxOpen_' + windowArr[i].id);
                windowIdKeyArr.push('windowChatboxWidth_' + windowArr[i].id);
                windowIdKeyArr.push('windowChatboxHeight_' + windowArr[i].id);
            }
            var storageItemKeys = Object.keys(items);
            var prop;
            for (var i = 0; i < storageItemKeys.length; i++) {
                prop = storageItemKeys[i];
                if (prop.startsWith('windowChatboxOpen_') && 
                        !windowIdKeyArr.includes(prop)) {
                    chrome.storage.local.remove(prop);
                } else if (prop.startsWith('windowChatboxWidth_') &&
                        !windowIdKeyArr.includes(prop)) {
                    chrome.storage.local.remove(prop);
                } else if (prop.startsWith('windowChatboxHeight_') &&
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
                // google-auth-session storage item to be used by popup
                chrome.storage.local.set({ 'google-auth-session': request.data });
                sendResponse({ code: 'success' });
                // send session to /auth/gate
                chrome.tabs.query({}, function(tabs) {
                    for (var i = 0; i < tabs.length; i++) {
                        chrome.tabs.sendMessage(tabs[i].id, { type: 'auth-google-session' });
                    }
                });
                break;
            case 'window-chatbox-close':
                var chatWindowOpenKey = 'windowChatboxOpen_' + sender.tab.windowId;
                chrome.storage.local.get(chatWindowOpenKey, function(item) {
                    if (item) {
                        chrome.storage.local.remove(chatWindowOpenKey);
                    }
                });
                break;
            case 'update-jwt':
                jwt = request.data.jwt;
                refreshPresenceWebsocketConnection();
                refreshChatWebsocketConnection();
                break;
            case 'update-user-info':
                shareMode = request.data.shareMode;
                domainAllowSet = new Set(request.data.domainAllowSet);
                domainDenySet = new Set(request.data.domainDenySet);
                if (request.data.updatePresence) {
                    sendPresenceWebsocket(sender.tab.url, sender.tab.title);
                }
                break;
            case 'get-curr-url':
                sendResponse({
                    code: 'success',
                    data: {
                        url: sender.tab.url,
                        domain: extractDomainFromUrl(sender.tab.url)
                    }
                });
                break;
            case 'send-message':
                sendMessageChatWebsocket(request.data);
                sendResponse({ code: 'success' });
                break;
            case 'read-messages':
                readMessagesChatWebsocket(request.data);
                sendResponse({ code: 'success' });
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
        switch (request.type) {
            case 'request-window-id':
                sendResponse({ code: 'success', data: { windowId: sender.tab.windowId } });
                break;
            case 'auth-jwt':
                jwt = request.data;
                sendResponse({ code: 'success' });
                refreshPresenceWebsocketConnection();
                refreshChatWebsocketConnection();
                break;
            case 'auth-null':
                disconnectPresenceWebsocket();
                disconnectChatWebsocket();
                windowChatboxOpen = {};
                shareMode = 'default_none';
                domainAllowSet = new Set([]);
                domainDenySet = new Set([]);
                jwt = undefined;
                currUrl = undefined;
                currDomain = undefined;
                const queryInfo = {
                    active: true,
                    currentWindow: true
                };
                chrome.tabs.query(queryInfo, tabs => {
                    if (tabs.length === 1) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'auth-null' });
                    }        
                }); 
                break;
            case 'curr-domain':
                sendResponse({ code: 'success', data: { currDomain: currDomain, currUrl: currUrl } });
                break;
            case 'update-domain-array':
                domainAllowSet = new Set(request.data.domainAllowArray);
                domainDenySet = new Set(request.data.domainDenyArray);
                var message = {
                    type: 'update-domain-array',
                    shareMode: request.data.shareMode,
                    domainAllowArray: request.data.domainAllowArray,
                    domainDenyArray: request.data.domainDenyArray
                };
                chrome.tabs.query({}, function(tabs) {
                    for (var i = 0; i < tabs.length; i++) {
                        chrome.tabs.sendMessage(tabs[i].id, message);
                    }
                });
                break;
            default:
                console.log("Request type " + request.type + " not found");
        }
    }
);

/**
 * Helper functions for presence websockets
 */
function connectPresenceWebsocket() {
    if (presenceWebsocket === null | presenceWebsocket === undefined) {
        try {
            if (jwt !== null && jwt !== undefined) {
                presenceWebsocket = new WebSocket(`${presenceWsHost}?Authorization=${jwt}`);
                console.log('Connected to presence websocket');
                presenceWebsocket.onmessage = function (event) {
                    var data = JSON.parse(event.data);
                    switch (data.type) {
                        case 'update-presence':
                            var message = {
                                type: 'update-presence',
                                userId: data.userId,
                                url: data.url,
                                title: data.title,
                                domain: data.domain
                            };
                            chrome.tabs.query({}, function(tabs) {
                                for (var i = 0; i < tabs.length; i++) {
                                    chrome.tabs.sendMessage(tabs[i].id, message);
                                }
                            });
                            break;
                        case 'presence-timeout':
                            var message = {
                                type: 'presence-timeout',
                                userId: data.userId
                            };
                            chrome.tabs.query({}, function(tabs) {
                                for (var i = 0; i < tabs.length; i++) {
                                    chrome.tabs.sendMessage(tabs[i].id, message);
                                }
                            });
                            break;
                        default:
                            console.log("Presence event type " + data.type + " not found");
                    }
                }
                presenceWebsocket.onclose = function() {
                    console.log('Presence websocket closed');
                    presenceWebsocket = undefined;
                }
            } else {
                console.log("Not authorized to connect to presence websocket");
            }
        } catch (error) {
            console.log(error);
        }
    } else {
        console.log('Already connected to', presenceWebsocket);
    }
}

function refreshPresenceWebsocketConnection() {
    if (presenceWebsocket === null || presenceWebsocket === undefined) {
        connectPresenceWebsocket();
    } else {
        if (jwt !== null && jwt !== undefined && presenceWebsocket.readyState !== WebSocket.OPEN
                && presenceWebsocket.readyState !== WebSocket.CONNECTING) {
            presenceWebsocket = undefined;
            connectPresenceWebsocket();
        }
    }
}

function disconnectPresenceWebsocket() {
    if (presenceWebsocket != null || presenceWebsocket != undefined) {
        console.log('Closing', presenceWebsocket);
        presenceWebsocket.close();
        presenceWebsocket = undefined;
    } else {
        console.log('Presence websocket is already closed');
    }
}

function getPresenceWebsocketStatus() {
    if (presenceWebsocket == null || presenceWebsocket == undefined) {
        return -1;
    } else {
        return presenceWebsocket.readyState;
    }
}

function sendPresenceWebsocket(url, title) {
    var updatedUrl = '';
    var updatedTitle = '';
    if (url != '') {
        try {
            url = new URL(url);
            var domain = window.psl.parse(url.hostname).domain;
            if ((shareMode == 'default_none' && domainAllowSet.has(domain)) ||
                (shareMode == 'default_all' && !domainDenySet.has(domain))) {
                updatedUrl = url;
                updatedTitle = title;
            }
        } catch (error) {
            console.log(url, title);
            console.log(error);
        }
    }

    refreshPresenceWebsocketConnection();
    if (presenceWebsocket !== null && presenceWebsocket !== undefined && presenceWebsocket.readyState === WebSocket.OPEN) {
        var data = {
            action: 'update-presence',
            url: updatedUrl,
            title: updatedTitle
        };
        presenceWebsocket.send(JSON.stringify(data));
    }
}

/**
 * Helper functions for chat websockets
 */
function connectChatWebsocket() {
    if (chatWebsocket === null | chatWebsocket === undefined) {
        try {
            if (jwt !== null && jwt !== undefined) {
                chatWebsocket = new WebSocket(`${chatWsHost}?Authorization=${jwt}`);
                console.log('Connected to chat websocket');
                chatWebsocket.onmessage = function (event) {
                    var data = JSON.parse(event.data);
                    switch (data.type) {
                        case 'new-message':
                            var message = {
                                type: 'new-message',
                                messageId: data.messageId,
                                tempMessageId: data.tempMessageId,
                                conversationId: data.conversationId,
                                senderId: data.senderId,
                                content: data.content,
                                sentAt: data.sentAt
                            }
                            chrome.tabs.query({}, function(tabs) {
                                for (var i = 0; i < tabs.length; i++) {
                                    chrome.tabs.sendMessage(tabs[i].id, message);
                                }
                            });
                            break;
                        case 'read-messages':
                            var message = {
                                type: 'read-messages',
                                conversationId: data.conversationId,
                                userId: data.userId
                            };
                            chrome.tabs.query({}, function(tabs) {
                                for (var i = 0; i < tabs.length; i++) {
                                    chrome.tabs.sendMessage(tabs[i].id, message);
                                }
                            });
                            break;
                        default:
                            console.log("Chat event type " + data.type + " not found");
                            console.log(data);
                    }
                }
                chatWebsocket.onclose = function() {
                    console.log('Chat websocket closed');
                    chatWebsocket = undefined;
                }
            } else {
                console.log("Not authorized to connect to chat websocket");
            }
        } catch (error) {
            console.log(error);
        }
    } else {
        console.log('Already connected to', chatWebsocket);
    }
}

function refreshChatWebsocketConnection() {
    if (chatWebsocket == null || chatWebsocket == undefined) {
        connectChatWebsocket();
    } else {
        if (chatWebsocket.readyState !== WebSocket.OPEN && chatWebsocket.readyState !== WebSocket.CONNECTING) {
            chatWebsocket = undefined;
            connectChatWebsocket();
        }
    }
}

function disconnectChatWebsocket() {
    if (chatWebsocket != null || chatWebsocket != undefined) {
        console.log('Closing', chatWebsocket);
        chatWebsocket.close();
        chatWebsocket = undefined;
    } else {
        console.log('Chat websocket is already closed');
    }
}

function sendMessageChatWebsocket(data) {
    refreshChatWebsocketConnection();
    if (chatWebsocket !== null && chatWebsocket !== undefined && chatWebsocket.readyState === WebSocket.OPEN) {
        var data = {
            action: 'send-message',
            tempMessageId: data.tempMessageId,
            content: data.content,
            conversationId: data.conversationId
        };
        chatWebsocket.send(JSON.stringify(data));
    }
}

function readMessagesChatWebsocket(data) {
    refreshChatWebsocketConnection();
    if (chatWebsocket !== null && chatWebsocket !== undefined && chatWebsocket.readyState === WebSocket.OPEN) {
        var data = {
            action: 'read-messages',
            conversationId: data.conversationId
        };
        chatWebsocket.send(JSON.stringify(data));
    }
}

function extractDomainFromUrl(url) {
    try {
        var urlObj = new URL(url);
        return window.psl.parse(urlObj.hostname).domain;
    } catch {
        return '';
    }
}

function updateCurrDomain(url) {
    currUrl = url;
    try {
        var urlObj = new URL(url);
        currDomain = window.psl.parse(urlObj.hostname).domain;
    } catch {
        currDomain = '';
    }
    // send the udpated domain and url to popup
    chrome.runtime.sendMessage({
        type: 'update-domain',
        domain: currDomain,
        url: url
    });
}

// TODO: set everything to false when disconnect?