/*global chrome*/
import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { sendMsgToIframe } from '../../shared/iframe';
import { CLIENT_URL } from '../../shared/config';
import './ChatboxIframe.css';

const minWidth = 400;
const minHeight = 200;
const defaultChatboxWidth = '400px';
const defaultChatboxHeight = '500px';

const ChatboxIframe = () => {
    const [ windowId, setWindowId ] = useState(-1);
    const [ chatboxOpen, setChatboxOpen ] = useState(false);
    const [ chatboxWidth, setChatboxWidth ] = useState(defaultChatboxWidth);
    const [ chatboxHeight, setChatboxHeight ] = useState(defaultChatboxHeight);
    const iframeRef = useRef();

    useEffect(() => {
        //intialize chatboxOpen - chrome.tabs and chrome.windows is undefined in componentDidMount
        if (windowId === -1) {
            chrome.runtime.sendMessage({ type: 'request-window-id', data: 'from ChatboxIframe useEffect()' }, res => {
                setWindowId(res.data.windowId);
            });
        } else {
            const windowChatboxOpenKey = `windowChatboxOpen_${windowId}`;
            const windowChatboxWidthKey = `windowChatboxWidth_${windowId}`;
            const windowChatboxHeightKey = `windowChatboxHeight_${windowId}`;

            chrome.storage.local.get(windowChatboxOpenKey, item => {
                if (item[windowChatboxOpenKey] && item[windowChatboxOpenKey] !== chatboxOpen) {
                    setChatboxOpen(item[windowChatboxOpenKey]);
                }
            });

            chrome.storage.local.get(windowChatboxWidthKey, item => {
                if (item[windowChatboxWidthKey] && item[windowChatboxWidthKey] !== chatboxWidth) {
                    setChatboxWidth(item[windowChatboxWidthKey]);
                }
            });

            chrome.storage.local.get(windowChatboxHeightKey, item => {
                if (item[windowChatboxHeightKey] && item[windowChatboxHeightKey] !== chatboxHeight) {
                    setChatboxHeight(item[windowChatboxHeightKey]);
                }
            });

            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (changes.hasOwnProperty(windowChatboxOpenKey)) {
                    setChatboxOpen(changes[windowChatboxOpenKey].newValue);
                }
                if (changes.hasOwnProperty(windowChatboxWidthKey)) {
                    setChatboxWidth(changes[windowChatboxWidthKey].newValue);
                }
                if (changes.hasOwnProperty(windowChatboxHeightKey)) {
                    setChatboxHeight(changes[windowChatboxHeightKey].newValue);
                }
            });
        }
    });

    const handleResize = (ref) => {
        chrome.storage.local.set({
            [`windowChatboxWidth_${windowId}`]: ref.style.width,
            [`windowChatboxHeight_${windowId}`]: ref.style.height
        });        
    };

    window.chatboxIframeRef = iframeRef;
    
    return (
        <div class='chatbox-iframe-div'>
            <Rnd style={{ display: chatboxOpen ? 'block' : 'none' }}
                className='chatbox-iframe-rnd'
                minWidth={ minWidth } minHeight={ minHeight }
                default={{ x: 0, y: 0 }}
                size={{ width: chatboxWidth, height: chatboxHeight }}
                dragAxis="x"
                onResizeStop={(e, direction, ref, delta, position) => {
                    handleResize(ref);
                }}
            >
                <iframe
                    allow="autoplay"
                    allowFullScreen={true}
                    webkitallowfullscreen="true"
                    mozallowfullscreen="true"
                    title="Chatbox"
                    ref={iframeRef}
                    className="chatbox-iframe"
                    src={CLIENT_URL}
                />     
            </Rnd>
        </div>
    );
}

export default ChatboxIframe;

if (chrome && chrome.extension) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case 'auth-session':
                sendMsgToIframe({
                    type: 'auth-session',
                    data: message.session
                });
                break;
            case 'auth-google-session': // try re-routing on client
                sendMsgToIframe({
                    type: 'auth-google-session'
                });
                break;
            case 'auth-null':
                sendMsgToIframe({
                    type: 'auth-null'
                });
                break;
            case 'update-presence':
                sendMsgToIframe({
                    type: 'update-presence',
                    data: {
                        userId: message.userId,
                        url: message.url,
                        title: message.title,
                        domain: message.domain,
                        latestUrl: message.latestUrl,
                        latestTitle: message.latestTitle,
                        latestDomain: message.latestDomain
                    }
                });
                break;
            case 'presence-timeout':
                sendMsgToIframe({
                    type: 'presence-timeout',
                    data: {
                        userId: message.userId
                    }
                });
                break;
            case 'new-message':
                sendMsgToIframe({
                    type: 'new-message',
                    data: {
                        messageId: message.messageId,
                        tempMessageId: message.tempMessageId,
                        conversationId: message.conversationId,
                        senderId: message.senderId,
                        content: message.content,
                        sentAt: message.sentAt
                    }
                });
                break;
            case 'read-messages':
                sendMsgToIframe({
                    type: 'read-messages',
                    data: {
                        conversationId: message.conversationId,
                        userId: message.userId
                    }
                });
                break;
            case 'update-domain-array':
                sendMsgToIframe({
                    type: 'update-domain-array',
                    data: {
                        domainAllowArray: message.domainAllowArray,
                        domainDenyArray: message.domainDenyArray
                    }
                });
                break;
            default:
                break;
        }
        sendResponse(null);
    });
}
