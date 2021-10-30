export const sendMsgToIframe = (msg) => {
    if (window.chatboxIframeRef && window.chatboxIframeRef.current) {
        window.chatboxIframeRef.current.contentWindow.postMessage(
            msg,
            "*"
        );
    }
}