function submitSignupForm(event) {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('password_confirm');
    const errorBox = document.getElementById('clientErrorBox');

    if (!usernameInput || !passwordInput) return true;

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput ? confirmInput.value : null;

    // Validate username minimum length (4 characters required by Flask-Security)
    if (username.length < 4) {
        event.preventDefault();
        showError('Username must be at least 4 characters long.');
        usernameInput.focus();
        return false;
    }

    // Validate password confirmation match
    if (confirmInput && password !== confirm) {
        event.preventDefault();
        showError('Passwords do not match. Please verify your password.');
        confirmInput.focus();
        return false;
    }

    // Clear previous errors
    if (errorBox) {
        errorBox.style.display = 'none';
        errorBox.textContent = '';
    }

    // Provide visual feedback on submission
    const submitBtn = document.getElementById('submit');
    if (submitBtn) {
        submitBtn.textContent = 'Creating Account...';
        submitBtn.style.opacity = '0.75';
    }

    return true;
}

function showError(message) {
    const errorBox = document.getElementById('clientErrorBox');
    if (errorBox) {
        errorBox.textContent = message;
        errorBox.style.display = 'block';
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
