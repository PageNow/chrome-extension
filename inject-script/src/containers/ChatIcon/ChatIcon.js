/* global chrome */
import React, { useEffect, useState } from 'react';
import Draggable from 'react-Draggable';

import './ChatIcon.css';
import iconImg from '../../logo192.png';

let isDragging = false;

function ChatIcon () {
    const [windowId, setWindowId] = useState(-1);
    useEffect(() => {
        chrome.runtime.sendMessage({ type: 'request-window-id'}, function(res) {
            setWindowId(res.data.windowId);
        });
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

    return (
        <Draggable onStart={handleStart} onDrag={handleDrag} onStop={handleStop}>
            <span className="chat-icon-span">
                <img alt='Chat Icon' src={iconImg} draggable="false"
                     style={{display: 'none'}}/>
            </span>
        </Draggable>
    );
}

export default ChatIcon;