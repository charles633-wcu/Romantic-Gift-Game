// src/config/biomes.js
// Shuffle-bag rotation: every biome appears exactly once per cycle before any repeat.
// Persisted to localStorage so the bag survives page reloads mid-run.

export const BIOMES = ['arctic', 'castle', 'city', 'cyberpunk', 'desert', 'forest', 'loveland', 'mountains', 'tropical', 'undersea', 'volcano'];

import { STORAGE_PREFIX } from '../constants.js';
const STORAGE_KEY = `${STORAGE_PREFIX}_biome_bag`;

function _loadBag() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Validate: must be a non-empty array of known biomes
    if (Array.isArray(saved) && saved.length > 0 && saved.every(b => BIOMES.includes(b))) {
      return saved;
    }
  } catch (_) {}
  return null;
}

function _newShuffledBag() {
  const bag = [...BIOMES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function getBiome() {
  let bag = _loadBag() || _newShuffledBag();
  const biome = bag.shift();          // take the next biome
  if (bag.length === 0) bag = _newShuffledBag(); // refill when exhausted
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
  return biome;
}
