export const sendMsgToIframe = (msg) => {
    
    if (window.chatboxIframeRef && window.chatboxIframeRef.current) {
        console.log(msg);
        window.chatboxIframeRef.current.contentWindow.postMessage(
            msg,
            "*"
        );
    }
}