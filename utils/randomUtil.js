// utils/randomUtils.js

// Generate a random string from given characters
function randomString(length, chars) {
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Generate random uppercase letters (e.g., 'ABCD')
function randomLetters(length = 4) {
  return randomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
}

// Generate random numbers (e.g., '123456')
function randomNumbers(length = 6) {
  return randomString(length, '0123456789');
}

module.exports = {
  randomString,
  randomLetters,
  randomNumbers,
};
