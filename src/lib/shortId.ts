// No 0/O or 1/I — avoids ambiguity when read aloud or handwritten.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateShortId(random: () => number = Math.random): string {
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return id;
}
