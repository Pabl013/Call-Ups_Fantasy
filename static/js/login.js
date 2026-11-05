let currentMode = 'email';

function switchLoginMode(mode) {
    currentMode = mode;
    const tabEmail = document.getElementById('tab-email');
    const tabUsername = document.getElementById('tab-username');
    const input = document.getElementById('identityInput');
    const label = document.getElementById('identityLabel');

    if (mode === 'username') {
        tabUsername.classList.add('active');
        tabEmail.classList.remove('active');
        label.textContent = 'Username';
        input.type = 'text';
        input.name = 'username';
        input.placeholder = 'johndoe';
        input.autocomplete = 'username';
    } else {
        tabEmail.classList.add('active');
        tabUsername.classList.remove('active');
        label.textContent = 'Email Address';
        input.type = 'email';
        input.name = 'email';
        input.placeholder = 'john@example.com';
        input.autocomplete = 'email';
    }
}

// Smart auto-detection on submit: if user typed an email with '@' in username mode, or username without '@' in email mode
document.getElementById('loginForm').addEventListener('submit', function() {
    const input = document.getElementById('identityInput');
    const val = input.value.trim();
    if (val.includes('@') && val.includes('.')) {
        input.name = 'email';
    }
    else if (currentMode === 'username' || !val.includes('@')) {
        input.name = 'username';
    }
});
