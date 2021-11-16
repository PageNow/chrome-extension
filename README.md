# PageNow chrome extension

## Overview

Using javascript injection, we create iframe that hosts chatbox.

* `popup/` contains the code for popup.html
* `inject-script/` contains the code that is injected by the chrome extension.

## Build

Popup and injection scripts must be built into `build/` to be uploaded to Chrome.

Run ```npm run-script build``` inside `popup/` and `inject-script/` to build the extension.

## Notes

* Google accounts sign-in is forbidden in an iframe due to Google's policy. It is also forbidden in Chrome extension popup. Thus, we open a new tab upon Google authentication and sync across the web and extension.

* Websocket (wss) doesn't accept headers, so we need to pass it as query param and verify at Lambda function level.

* We get jwt using Amplify, but background.js does not use Amplify. Thus, we refresh jwt as frequently as possible to prevent jwt from being expired.

## Chrome Store Upload

* Update `presenceWsHost` and `chatWsHost` in `background.js`.
* Update `externally_connectable` in `manifest.json`.
* Update `CLIENT_URL` in `inject-script/src/shared/config.js`.
* Update `USER_API_URL`, `CLIENT_URL` in `popup/src/shared/config.js`.

## References

### background.js websocket

* https://github.com/fregante/GhostText/blob/main/source/background.js
* https://medium.com/swlh/implementing-secure-web-sockets-with-aws-api-gateway-cognito-dynamodb-and-lambda-b38e02314b42
* http://iostreamer.me/ws/node.js/jwt/2016/05/08/websockets_authentication.html

### External monitor bug fix

* https://stackoverflow.com/questions/56500742/why-is-my-google-chrome-extensions-popup-ui-laggy-on-external-monitors-but-not
