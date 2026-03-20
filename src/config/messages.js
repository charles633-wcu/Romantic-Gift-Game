// src/config/messages.js
export const MESSAGES = [
  "Every love story is beautiful, but ours is my favorite. 💕",
  "You make every ordinary moment feel extraordinary. 💕",
  "You are my sunshine on the darkest days. 💕",
  "Even the hard days are easier with you by my side. 💕",
  "You are the missing piece I never knew I needed. 💕",
  "Home is wherever I am with you. 💕",
  "Every moment with you is one I will treasure forever. 💕",
  "You are my forever. Thank you for every moment. 💕",
  "You turn the ordinary into something magical. 💕",
  "I never knew what I was looking for until I found you. 💕",
  "Being with you feels like coming home. 💕",
  "You make the world more beautiful just by being in it. 💕",
  "You are my favorite adventure. 💕",
  "You are my sunshine on a cloudy day. 💕",
  "I am so grateful to have you in my life. 💕",
  "You have my heart, always. 💕",
  "You make me want to be a better person. 💕",
  "Loving you is the easiest thing I've ever done. 💕",
  "You are everything I didn't know I needed. 💕",
  "Thank you for choosing me, every single day. 💕",
  "I love you more with every passing day. 💕",
  "You are my safe place. 💕",
  "With you, every day feels like a gift. 💕",
  "Te quiero más de lo que las palabras pueden expresar. 💕",
  "Eres mi lugar seguro en este mundo. 💕",
  "Falling in love with you was the best thing I ever did. 💕",
  "You make every second count. 💕",
  "I love the way you make me feel. 💕",
  "There is no one else I would rather share this adventure with. 💕",
];

export function getRandomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}
