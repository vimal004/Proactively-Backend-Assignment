const emailValidator = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const passwordValidator = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}|\[\]\\:;,.<>?/~`]).{8,}$/;
  return passwordRegex.test(password);
};

module.exports = { emailValidator, passwordValidator };
