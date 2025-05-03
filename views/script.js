document.addEventListener('DOMContentLoaded', function () {
  // Password toggle
  const togglePassword = document.getElementById('togglePassword');
  const password = document.getElementById('password');
  if (togglePassword && password) {
    togglePassword.addEventListener('click', function () {
      if (password.type === 'password') {
        password.type = 'text';
        togglePassword.classList.remove('bi-eye-slash');
        togglePassword.classList.add('bi-eye');
      } else {
        password.type = 'password';
        togglePassword.classList.remove('bi-eye');
        togglePassword.classList.add('bi-eye-slash');
      }
    });
  }

  // Play login sound if login was successful
  const success = <%- JSON.stringify(success) %>;
  if (success) {
    const audio = document.getElementById('loginSound');
    audio.play().catch(e => console.log("Audio play blocked:", e));
  }
});
