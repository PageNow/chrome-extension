/* global chrome */
import React, { useEffect, useState } from 'react';
import Draggable from 'react-Draggable';

import './ChatIcon.css';
import iconImg from '../../assets/PageNowIcon.png';

let isDragging = false;

function ChatIcon () {
    const [ windowId, setWindowId ] = useState(-1);
    const [ showChatIcon, setShowChatIcon ] = useState(true);

    useEffect(() => {
        if (windowId === -1) {
            chrome.runtime.sendMessage({ type: 'request-window-id', data: 'from ChatIcon useEffect()' }, function(res) {
                setWindowId(res.data.windowId);
            });
        } else {
            const showChatIconKey = 'showChatIcon';
            chrome.storage.local.get([showChatIconKey], item => {
                if (item.showChatIcon === undefined || item.showChatIcon === null) {
                    setShowChatIcon(true);
                } else {
                    setShowChatIcon(item.showChatIcon);
                }
            });

            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (showChatIconKey in changes) {
                    setShowChatIcon(changes.showChatIcon.newValue);
                }
            });
        }
    });

    const handleStart = () => {
        isDragging = false;
    }
    
    const handleDrag = () => {
        isDragging = true;
    }
    
    const handleStop = (e) => {
        if (!isDragging) {
            handleIconClick();
        }
        isDragging = false;
    }
    
    const handleIconClick = () => {
        const windowChatboxOpenKey = 'windowChatboxOpen_' + windowId;
        chrome.storage.local.get(windowChatboxOpenKey, item => {
            const updatedItem = {}
            updatedItem[windowChatboxOpenKey] = !item[windowChatboxOpenKey];
            chrome.storage.local.set(updatedItem);
        });
    }

    if (showChatIcon) {
        return (
            <Draggable onStart={handleStart} onDrag={handleDrag} onStop={handleStop}>
                <span className="pagenow-chat-icon-span">
                    <img alt='Chat Icon' src={iconImg} draggable="false"
                         style={{display: 'none'}}/>
                </span>
            </Draggable>
        );
    } else {
        return <span />
    }
}

export default ChatIcon;