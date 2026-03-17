// Sound types for different user actions
export type SoundType = 'addNote' | 'deleteNote' | 'addSubitem' | 'checkSubitem' | 'uncheckSubitem';

// Import audio files using Vite's import system
// Vite will hash these and return URLs at build time
import addNoteSound from '../assets/audio/click-click.mp3';
import deleteNoteSound from '../assets/audio/bye-bye.mp3';
import addSubitemSound from '../assets/audio/cheek-pop.mp3';
import checkSubitemSound from '../assets/audio/clickity.mp3';
import uncheckSubitemSound from '../assets/audio/clackity.mp3';

// Map of sound types to Audio objects
const audioMap = new Map<SoundType, HTMLAudioElement | null>();

// Initialize and preload all audio files
function initializeSounds() {
  const soundFiles: Array<[SoundType, string]> = [
    ['addNote', addNoteSound],
    ['deleteNote', deleteNoteSound],
    ['addSubitem', addSubitemSound],
    ['checkSubitem', checkSubitemSound],
    ['uncheckSubitem', uncheckSubitemSound],
  ];

  soundFiles.forEach(([soundType, soundUrl]) => {
    try {
      const audio = new Audio(soundUrl);
      // Preload the audio file
      audio.preload = 'auto';
      audioMap.set(soundType, audio);
    } catch (error) {
      console.warn(`Failed to load ${soundType} sound:`, error);
      audioMap.set(soundType, null);
    }
  });
}

// Initialize sounds immediately
initializeSounds();

/**
 * Play a sound effect
 * @param soundType - The type of sound to play
 * @param isMuted - Whether sounds are currently muted
 */
export function playSound(soundType: SoundType, isMuted: boolean): void {
  // Don't play if muted
  if (isMuted) {
    return;
  }

  // Get the audio object for this sound type
  const audio = audioMap.get(soundType);

  // If audio failed to load, silently skip
  if (!audio) {
    return;
  }

  try {
    // Reset to beginning to allow rapid repeated plays
    audio.currentTime = 0;

    // Play the sound (returns a Promise)
    audio.play().catch((error) => {
      // Silently handle autoplay restrictions
      // NotAllowedError is expected on first play before user interaction
      if (error.name !== 'NotAllowedError') {
        console.warn(`Failed to play ${soundType} sound:`, error);
      }
    });
  } catch (error) {
    console.warn(`Error playing ${soundType} sound:`, error);
  }
}
