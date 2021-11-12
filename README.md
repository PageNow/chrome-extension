# chrome-extension
Chrome extension code.

With javascript injection, we create iframe that hosts chatbox.

* Popup contains the code for popup.html
* Inject-script contains the code that is injected by the chrome extension.

## Build

Popup and injection scripts are built into `build/`. `build/` is uploaded to Chrome.

Run ```npm run-script build``` inside `popup/` and `inject-script/` to build the extension.

## Notes

* Note that Google accounts sign-in cannot happen in an iframe due to Google's policy. Thus, we need to set up the authentication in popup.html.

* wss doesn't accept headers, so we need to pass it as query param and verify at Lambda function level

* jwt expiration

* since there are many tabs open, it may be better to just send to currently active tab and when someone accesses pages, pull data from server

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
