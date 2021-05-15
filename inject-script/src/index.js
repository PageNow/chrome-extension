import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// import { Auth } from "@aws-amplify/auth";
// import awsmobile from "./aws-exports";

// Auth.configure(awsmobile);

const elemId = "pagenow-extension-root";

const element = document.getElementById(elemId);
if (element) {
    alert("PageNow is already loaded");
} else {
    const extElement = document.createElement("span");
    extElement.id = elemId;
    document.body.appendChild(extElement);
    
    ReactDOM.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
        extElement
    );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
