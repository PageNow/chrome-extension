import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Auth } from '@aws-amplify/auth';

import { CURR_DATE, CURR_MONTH, CURR_YEAR, DATES, isDateValid, MONTHS, MONTHS_STR_TO_NUM, YEARS } from '../../shared/utils';
import styles from './UserRegistration.module.css';
import axios from 'axios';
import { USER_API_URL } from '../../shared/constants';

class UserRegistration extends React.Component {
    state = {
        firstNameInput: '',
        lastNameInput: '',
        dobMonth: MONTHS[CURR_MONTH],
        dobDate: CURR_DATE,
        dobYear: CURR_YEAR,
        gender: '',
        errorMsg: ''
    }

    handleFirstNameInput = (event) => {
        this.setState({
            firstNameInput: event.target.value
        });
    }

    handleLastNameInput = (event) => {
        this.setState({
            lastNameInput: event.target.value
        });
    }

    handleDobMonthSelect = (event) => {
        this.setState({ dobMonth: event.target.value });
    }

    handleDobDateSelect = (event) => {
        this.setState({ dobDate: event.target.value });
    }

    handleDobYearSelect = (event) => {
        this.setState({ dobYear: event.target.value });
    }

    handleGenderInput = (event) => {
        this.setState({ gender: event.target.value });
    }

    handleOtherGenderInput = (event) => {
        this.setState({ otherGender: event.target.value });
    }

    saveUserInformation = () => {
        this.props.setIsLoading(true);
        const dobMonthNum = (MONTHS_STR_TO_NUM[this.state.dobMonth] + 1) + '';
        const dob = this.state.dobYear + '-' + dobMonthNum.padStart(2, '0')
                    + '-' + this.state.dobDate;
        if (!isDateValid(dob)) {
            this.errorMsg = 'Date of birth is an invalid date.';
            return;
        }

        Auth.currentSession()
            .then(session => {
                const httpHeaders = {
                    headers: { Authorization: `Bearer ${session.getIdToken().getJwtToken()}` }
                };
                const httpBody = {
                    first_name: this.state.firstNameInput,
                    last_name: this.state.lastNameInput,
                    gender: this.state.gender,
                    dob: dob
                };
                axios.post(`${USER_API_URL}/users/me`, httpBody, httpHeaders)
                    .then(res => {
                        console.log(res);
                        this.props.setIsLoading(false);
                    })
                    .catch(err => {
                        console.log(err);
                        this.setState({ errorMsg: 'Internal server error' });
                        this.props.setIsLoading(false);
                    });
            });
    }

    render() {
        const monthOptions = MONTHS.map(month => <option value={month}>{ month }</option>);
        const dateOptions = DATES.map(date => <option value={date}>{ date }</option>);
        const yearOptions = YEARS.map(year => <option value={year}>{ year }</option>);

        let errorMsgDiv;
        if (this.state.errorMsg !== '') {
            errorMsgDiv = (
                <div className={styles.errorMsgDiv}>* { this.state.errorMsg }</div>
            );
        }

        return (
            <div className={styles.mainDiv}>
                <div className={styles.headerDiv}>Submit User Information</div>
                <div className={styles.subheaderDiv}>
                    <strong>Name</strong>
                </div>
                <div className={styles.nameInputDiv}>
                    <Form.Control size="sm" className={styles.nameInputLeft}
                        placeholder='First Name' value={this.state.firstNameInput}
                        onChange={this.handleFirstNameInput} maxlength='50'
                    />
                    <Form.Control size="sm" className={styles.nameInputRight}
                        placeholder='Last Name' value={this.state.lastNameInput}
                        onChange={this.handleLastNameInput} maxlength='50'
                    />
                </div>
                <div className={styles.subheaderDiv}>
                    <strong>Date of Birth</strong>
                </div>
                <div class={styles.dobInputDiv}>
                    <select className={styles.select} value={this.state.dobMonth}
                        onChange={this.handleDobMonthSelect}>
                        { monthOptions }
                    </select>
                    <select className={styles.select} value={this.state.dobDate}
                        onChange={this.handleDobDateSelect}>
                        { dateOptions }
                    </select>
                    <select className={styles.select} value={this.state.dobYear}
                        onChange={this.handleDobYearSelect}>
                        { yearOptions }
                    </select>
                </div>
                <div className={styles.subheaderDiv}>
                    <strong>Gender</strong>
                </div>
                <div className={styles.genderInputDiv} onChange={this.handleGenderInput}>
                    <div className={styles.genderInput}>
                        <input type="radio" value="male" name="gender" />
                        <span className={styles.genderLabel}>Male</span>
                    </div>
                    <div className={styles.genderInput}>
                        <input type="radio" value="female" name="gender" />
                        <span className={styles.genderLabel}>Female</span>
                    </div>
                    <div className={styles.genderInput}>
                        <input type="radio" value="other" name="gender" />
                        <span className={styles.genderLabel}>Other</span>
                    </div>
                </div>
                <Button variant='dark' size='sm' onClick={this.saveUserInformation} className={styles.saveButton}
                    disabled={this.state.firstNameInput.length === 0 || this.state.lastNameInput.length === 0 ||
                        !(this.state.gender === 'male' || this.state.gender === 'female' || this.state.gender === 'other')}>
                    Save User Information
                </Button>
                { errorMsgDiv }
            </div>
        )
    }
}

export default UserRegistration;