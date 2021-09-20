/*global chrome*/

// local storage is saved per page (i think)... resets for different pages

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { sendMsgToIframe } from '../../utils/iframe';
import './ChatboxIframe.css';

function ChatboxIframe() {
    const [chatboxOpen, setChatboxOpen] = useState(false);
    const iframeRef = useRef();

    useEffect(() => {
        //intialize chatboxOpen - chrome.tabs and chrome.windows is undefined in componentDidMount
        chrome.runtime.sendMessage({ type: 'request-window-id'}, function(res) {
            const windowId = res.data.windowId;
            const windowChatboxOpenKey = 'windowChatboxOpen_' + windowId;
            chrome.storage.local.get(windowChatboxOpenKey, item => {
                setChatboxOpen(item[windowChatboxOpenKey]);
            });

            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (windowChatboxOpenKey in changes) {
                    setChatboxOpen(changes[windowChatboxOpenKey].newValue);
                }
            });
        });
    })

    window.chatboxIframeRef = iframeRef;
    
    return (
        <div class='chatbox-iframe-div'>
            <Rnd style={{display: chatboxOpen
                                  ? 'block' : 'none' }}
                 className='chatbox-iframe-rnd'
                 minWidth="400" minHeight="200"
                 default={{x: 0, y: 0, width: 400, height: 500}}
                 dragAxis="x">
                <iframe
                    allow="autoplay"
                    allowFullScreen={true}
                    webkitallowfullscreen="true"
                    mozallowfullscreen="true"
                    title="Chatbox"
                    ref={iframeRef}
                    className="chatbox-iframe"
                    src="http://localhost:4200"
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
            case 'auth-null':
                sendMsgToIframe({
                    type: 'auth-null'
                });
                break;
            case 'update-presence':
                sendMsgToIframe({
                    type: 'update-presence',
                    data: {
                        type: 'update-presence',
                        userId: message.userId,
                        url: message.url,
                        title: message.title,
                        domain: message.domain
                    }
                });
                break;
            default:
                console.log('Message type ' + message.type + ' is unknown');
                break;
        }
        sendResponse(null);
    });
}
