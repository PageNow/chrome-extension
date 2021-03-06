/*global chrome*/
import React from 'react';

import styles from './TabWarning.module.css';
import PageNowLogo from '../../assets/PageNow_logo_500*118.png';

class TabWarning extends React.Component {
    render() {
        return (
            <div className={styles.mainDiv}>
                <div className={styles.headerDiv}>
                    <img className={styles.headerImg} src={PageNowLogo} alt="PageNow Logo"/>
                </div>
                <div className={styles.warningDiv}>
                    { chrome.i18n.getMessage("switchTabWarningMessage") }
                </div>
            </div>
        )
    }
}

export default TabWarning;
