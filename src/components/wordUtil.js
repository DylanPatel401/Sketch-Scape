export const getRandomWords = async () => {
  const response = await fetch('/word.txt'); 
  const text = await response.text();

  
  const words = text
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(w => /^[a-zA-Z]+$/.test(w)); 

  const choices = new Set();
  while (choices.size < 3 && words.length > 0) {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    choices.add(randomWord);
  }

  return Array.from(choices);
};
