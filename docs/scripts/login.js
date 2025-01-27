// import { setGuestMode } from '../utilities.js';
const emailInfo = document.getElementById('email-box');
const pwdInfo = document.getElementById('pwd-box');
const loginBtn = document.getElementById('login-button');
const signUpBtn = document.getElementById('sign-up-button');
const newAccountBtn = document.getElementById('create-new-account');
const loginAgainBtn = document.getElementById('login-again');
const foPaBtn = document.getElementById('forgot-user-information');
const rudToggle = document.getElementById('rudimentary-toggle');

foPaBtn.addEventListener('click', function (event) {
    if (rudToggle.style.display === 'grid') {
        rudToggle.style.display = 'none';
        return;
    }
    rudToggle.style.display = 'grid';
});

loginBtn.addEventListener('click', function (event) {
    var incorrectToggle = document.getElementById('incorrect-toggle');
    if (emailInfo.textContent.length === 0 || pwdInfo.value.length === 0) {
        incorrectToggle.style.display = 'grid';
        return;
    }
    fetch('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInfo.textContent.trim(), password: pwdInfo.value }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            console.log(response.status)
            return response.json();
        })
        .then(data => {
            console.log('Response from the backend:', data);

            if (data.error) {
                console.error('Server error:', data.error);
                incorrectToggle.style.display = 'grid'; 
                return;
            }

            if (data.message === 'Incorrect/missing information') {
                incorrectToggle.style.display = 'grid';
            } else if (data.message === 'Login successful') {
                // setGuestMode(false, emailInfo.textContent);
                console.log('Login successful', data.token);
                localStorage.setItem('token', data.token);
                window.open('index.html', '_blank');
            } else {
                console.error('Unexpected response:', data);
            }
        })
        .catch(error => {
            console.error('Fetch or network error:', error.message || error);
        });

});
signUpBtn.addEventListener('click', function (event) {
    const newName = document.getElementById('first-name').textContent;
    const newEmail = document.getElementById('login-sign-up').textContent;
    const newPwd = document.getElementById('pwd-sign-up').textContent;
    var incorrectToggle = document.getElementById('incorrect-toggle-1');
    if (newName.length === 0 || newEmail.length === 0 || newPwd.length === 0) {
        incorrectToggle.style.display = 'grid';
        return;
    }
    fetch('/users/signup', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPwd }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            if (data.error) {
                incorrectToggle.style.display = 'grid';
            }
            if (data.message === 'Missing username/email/password') {
                incorrectToggle.style.display = 'grid';
            }
            else if (data.message === "Successfully created an account") {
                // setGuestMode(false, emailInfo.textContent);
                localStorage.setItem('token', data.token);
                window.open('index.html', '_blank');
            }
        })
        .catch(error => {
            console.error('Fetch or network error:', error.message || error);
        });
});
newAccountBtn.addEventListener('click', function (event) {
    const signupBox = document.getElementById('sign-up-box');
    const loginBox = document.getElementById('login-box');
    if (signupBox.style.display === 'none') {
        signupBox.style.display = 'grid';
        loginBox.style.display = 'none';
    }
});
loginAgainBtn.addEventListener('click', function (event) {
    const signupBox = document.getElementById('sign-up-box');
    const loginBox = document.getElementById('login-box');
    if (loginBox.style.display === 'none') {
        signupBox.style.display = 'none';
        loginBox.style.display = 'grid';
    }
});