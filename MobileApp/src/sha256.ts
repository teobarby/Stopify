/**
 * sha256.ts
 * Implementazione SHA-256 pura in TypeScript (no dipendenze native).
 * Usata per il Proof of Work lato client.
 */

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = "";

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  // Costanti k
  const k: number[] = [];
  // Costanti h iniziali
  let hash: number[] = [];
  let primes: number[] = [];

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primes.length < 64; candidate++) {
    if (!isComposite[candidate]) {
      primes.push(candidate);
      for (let i = candidate * candidate; i < 313; i += candidate) {
        isComposite[i] = true;
      }
    }
  }

  for (let i = 0; i < 64; i++) {
    const p = primes[i];
    const frac8  = mathPow(p, 1 / 2);
    const frac64 = mathPow(p, 1 / 3);
    if (i < 8) {
      hash[i] = (frac8  % 1) * maxWord | 0;
    }
    k[i]    = (frac64 % 1) * maxWord | 0;
  }

  // Pre-processing
  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return ""; // non-ASCII
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  // Processo a blocchi da 512 bit
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];

    for (let i = 0; i < 64; i++) {
      const i2 = i < 16 ? w[i] : (
        (rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10)) +
        w[i - 7] +
        (rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3)) +
        w[i - 16]
      ) | 0;
      w[i] = i2;

      const S1    = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch    = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = hash[7] + S1 + ch + k[i] + i2;
      const S0    = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj   = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = S0 + maj;

      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ("0" + b.toString(16)).slice(-2);
    }
  }
  return result;
}
