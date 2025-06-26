export const getRandomWords = async () => {
  const response = await fetch('../assets/word.txt');
  const text = await response.text();
  const words = text.split('\n').map(w => w.trim()).filter(Boolean);
  const choices = [];

  while (choices.length < 3) {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    if (!choices.includes(randomWord)) {
      choices.push(randomWord);
    }
  }

  return choices;
};
