let currentMode = 'email';
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function switchLoginMode(mode) {
    currentMode = mode;
    const tabEmail = document.getElementById('tab-email');
    const tabUsername = document.getElementById('tab-username');
    const input = document.getElementById('identityInput');
    const label = document.getElementById('identityLabel');
    const errorBox = document.getElementById('clientErrorBox');

    if (errorBox) {
        errorBox.style.display = 'none';
        errorBox.textContent = '';
    }

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

// Username or email validation and detection on submit
document.getElementById('loginForm').addEventListener('submit', function(event) {
    const input = document.getElementById('identityInput');
    const errorBox = document.getElementById('clientErrorBox');
    const val = input.value.trim();

    if (currentMode === 'email') {
        if (!emailRegex.test(val)) {
            event.preventDefault();
            if (errorBox) {
                errorBox.textContent = 'Please enter a valid email address.';
                errorBox.style.display = 'block';
                errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            input.focus();
            return;
        }
        input.name = 'email';
    } else if (emailRegex.test(val)) {
        input.name = 'email';
    } else {
        input.name = 'username';
    }

    if (errorBox) {
        errorBox.style.display = 'none';
        errorBox.textContent = '';
    }
});

