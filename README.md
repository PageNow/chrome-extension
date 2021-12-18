[한국어 README.md](./README_KO.md)

PageNow Home Page: https://pagenow.io <br/>
PageNow Chrome Web Store: https://chrome.google.com/webstore/detail/pagenow/lplobiaakhgkjcldopgkbcibeilddbmc

# PageNow Chrome Extension

This repository contains code for PageNow Chrome extension. The [build](./build/) directory is compressed and uploaded to the Chrome Web Store.

<p align="center">
<img src="./images/chrome_store_image.png" width = "500"/>
</p>

## Overview

A Chrome extension is composed of two components: popup and content script. Popup is the screen that pops up when you click the extension icon. Content script is the script that runs in each page opened on the Chrome browser. PageNow Chrome extension is also composed of two components (popup and inject-script) and the output directory (build).

* [popup](./popup/) contains the code that runs when the extension popup is opened.

* [inject-script](./inject-script) contains the code injected to each page (PageNow client and PageNow icon). It also serves as a bridge between the PageNow client and *background.js*.

* [build](./build/) is the output directory that holds the built code of popup and inject-script. It also contains core files, such as [mainfest.json](./build/manifest.json) and [background.js](./build/background.js)

## Local Configuration

The following should be configured for local development.

* `externally_connectable` in [build/manifest.json](./build/manifest.json) must include the localhost for the client running locally. It allows the local PageNow client to exchange messages with the Chrome extension. If you are running Angular app locally with the default settings, you need to add `http://localhost:4200/*` to the `externally_connectable` array.

* `CLIENT_URL` in [inject-script/src/shared/config.js](./inject-script/src/shared/config.js) must be set to the endpoint of the PageNow client running locally (http://localhost:4200). It provides the source address to host in the injected iframe.

* `CLIENT_URL` in [popup/src/shared/config.js](./popup/src/shared/config.js) must be set as above to enable authentication flow on the extension popup.

* `USER_API_URL` in [popup/src/shared/config.js](./popup/src/shared/config.js) must be set to the endpoint of the target User API. For the Fast API server running locally with the default settings, it is `http://localhost:8000`.

## Chrome Web Store Deployment Configurations

The following are configurations that need to be checked before building the package to upload to the Chrome Web Store.

* Update `presenceWsHost` and `chatWsHost` to production endpoints in [build/background.js](./build/background.js).

* Update `externally_connectable` in [build/manifest.json](./build/manifest.json) so that *matches* array only contains `<PRODUCTION_CLIENT_URL>/*`.

* Update `CLIENT_URL` in [inject-script/src/shared/config.js](./inject-script/src/shared/config.js).

* Update `USER_API_URL`, `CLIENT_URL` in [popup/src/shared/config.js](./popup/src/shared/config.js).

## Build and Deployment

Follow the following steps to generate the package and upload it the Chrome Web Store.

1. Build `popup` and `inject-script` by running ```npm run-script build``` in [popup/](./popup/) directory and [inject-script/](./inject-script/) directory to build the extension.

2. Compress the [build](./build/) directory to generate `build.zip`.

3. Upload `build.zip` to Chrome Web Store Developer Dashboard. Note that it usually takes at least 2-3 days for the updated package to be approved and published (at least for the PageNow extension).

<p align="center">
<img src="./images/chrome_web_store_developer_dashboard.png" width = "600"/>
</p>

## Notes

* Google Sign In is forbidden inside the iframe and the extension popup due to Google's policy at least for now. Thus, we open a new tab upon Google authentication and sync across the PageNow client and extension.

* Websocket (wss) doesn't accept headers, so we need to pass jwt as a query parameter and verify it at AWS Lambda function level.

* We get jwt using Amplify, but background.js does not use Amplify. Thus, we refresh jwt as frequently as possible to prevent jwt from being expired.
