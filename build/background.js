var presenceWsHost = 'wss://8ndbkdh855.execute-api.us-west-2.amazonaws.com/dev/';
var chatWsHost = 'wss://jlhjv9x78h.execute-api.us-west-2.amazonaws.com/dev/';

var presenceWebsocket;
var chatWebsocket;

var windowChatboxOpen = {};
var shareMode = 'default_none';
var domainAllowSet = new Set([]);
var domainDenySet = new Set([]);
var jwt;

var currUrl;
var currDomain;

chrome.alarms.create('pagenow-heartbeat', {
    delayInMinutes: 1,
    periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'pagenow-heartbeat') {
        console.log('heartbeat alarm');
        if (presenceWebsocket != null || presenceWebsocket != undefined) {
            console.log('sending heartbeat to server');
            presenceWebsocket.send(JSON.stringify({
                action: 'heartbeat',
                jwt: jwt,
            }));
        }
    }
});

// when the tab url is updated
// TODO: check if the tab is currently open tab
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        sendPresenceWebsocket(tab.url, tab.title);
        updateCurrDomain(tab.url);
    }
});

// when the tab on a window is changed
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab) {
            sendPresenceWebsocket(tab.url, tab.title);
            updateCurrDomain(tab.url);
        }
    });
});

// when window focus is changed
chrome.windows.onFocusChanged.addListener(function(windowId) {
    console.log('onFocusChanged: ', windowId);
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
});

// when a new window is opened, clean up the storage
// opening window is not a very frequent event
chrome.windows.onCreated.addListener(function(windowId) {
    console.log('new window opened: ', windowId);
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
                console.log('window-chatbox-close', sender.tab.windowId);
                var chatWindowOpenKey = 'windowChatboxOpen_' + sender.tab.windowId;
                chrome.storage.local.get(chatWindowOpenKey, function(item) {
                    if (item) {
                        chrome.storage.local.remove(chatWindowOpenKey);
                    }
                });
                break;
            case 'update-jwt':
                console.log(request);
                jwt = request.data.jwt;
                break;
            case 'update-user-info':
                shareMode = request.data.shareMode;
                domainAllowSet = new Set(request.data.domainAllowSet);
                domainDenySet = new Set(request.data.domainDenySet);
                break;
            case 'get-curr-url':
                sendResponse({
                    code: 'success',
                    data: {
                        url: currUrl,
                        domain: currDomain
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
        console.log(request);
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
            case 'connect-websocket': // for testing
                connectPresenceWebsocket();
                connectChatWebsocket();
                break;
            case 'disconnect-websocket': // for testing
                disconnectPresenceWebsocket();
                disconnectChatWebsocket();
                break;
            case 'websocket-status':
                var status = getPresenceWebsocketStatus();
                sendResponse({ status: status });
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
                console.log('Connected to the presenceWebsocket');
                presenceWebsocket.onmessage = function (event) {
                    var data = JSON.parse(event.data);
                    switch (data.type) {
                        case 'update-presence':
                            console.log(data);
                            var message = {
                                type: 'update-presence',
                                userId: data.userId,
                                url: data.url,
                                title: data.title,
                                domain: data.domain
                            }
                            chrome.tabs.query({}, function(tabs) {
                                for (var i = 0; i < tabs.length; i++) {
                                    chrome.tabs.sendMessage(tabs[i].id, message);
                                }
                            });
                            break;
                        default:
                            console.log("Presence event type " + data.type + " not found");
                            console.log(data);
                    }
                }
                presenceWebsocket.onclose = function() {
                    console.log('Presence websocket closed');
                    presenceWebsocket = undefined;
                }
            } else {
                console.log("Missing jwt");
            }
        } catch (error) {
            console.log(error);
        }
    } else {
        console.log('Already connected to', presenceWebsocket);
    }
}

function refreshPresenceWebsocketConnection() {
    if (presenceWebsocket == null || presenceWebsocket == undefined) {
        connectPresenceWebsocket();
    } else {
        if (presenceWebsocket.readyState !== WebSocket.OPEN && presenceWebsocket.readyState !== WebSocket.CONNECTING) {
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
    try {
        url = new URL(url);
        var domain = window.psl.parse(url.hostname).domain;
        if ((shareMode == 'default_none' && domainAllowSet.has(domain)) ||
            (shareMode == 'default_all' && !domainDenySet.has(domain))) {
            updatedUrl = url;
            updatedTitle = title;
        }
    } catch (error) {
        console.log(error);
    }

    refreshPresenceWebsocketConnection();
    if (presenceWebsocket !== null && presenceWebsocket !== undefined && presenceWebsocket.readyState === WebSocket.OPEN) {
        var data = {
            action: 'update-presence',
            url: updatedUrl,
            title: updatedTitle,
            jwt: jwt
        };
        console.log('Sending ws message for url ' + url);
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
                console.log('Connected to the chatWebsocket');
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
                            console.log(message);
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
                console.log("Missing jwt");
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
            jwt: jwt,
            tempMessageId: data.tempMessageId,
            content: data.content,
            conversationId: data.conversationId
        };
        console.log('chatWebsocket - send_message');
        chatWebsocket.send(JSON.stringify(data));
    }
}

function readMessagesChatWebsocket(data) {
    refreshChatWebsocketConnection();
    if (chatWebsocket !== null && chatWebsocket !== undefined && chatWebsocket.readyState === WebSocket.OPEN) {
        var data = {
            action: 'read-messages',
            jwt: jwt,
            conversationId: data.conversationId
        };
        console.log('chatWebsocket - read_messages');
        chatWebsocket.send(JSON.stringify(data));
    }
}

function updateCurrDomain(url) {
    currUrl = url;
    var urlObj = new URL(url);
    currDomain = window.psl.parse(urlObj.hostname).domain;
}

// TODO: set everything to false when disconnect?