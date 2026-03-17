import { createContext, useContext, ParentComponent, onMount } from 'solid-js';
import { createSignal } from 'solid-js';
import { playSound as playSoundFromManager, SoundType } from '../utils/soundManager';

// Context interface
interface SoundContextType {
  isMuted: () => boolean;
  toggleMute: () => void;
  playSound: (soundType: SoundType) => void;
}

// Create context
const SoundContext = createContext<SoundContextType>();

// LocalStorage key for persisting mute preference
const SOUND_ENABLED_KEY = 'soundEnabled';

// Provider component
export const SoundContextProvider: ParentComponent = (props) => {
  // Initialize mute state (default: sounds enabled)
  const [isMuted, setIsMuted] = createSignal(false);

  // Load mute preference from localStorage on mount
  onMount(() => {
    const storedPreference = localStorage.getItem(SOUND_ENABLED_KEY);
    if (storedPreference !== null) {
      // If preference exists, set muted to the opposite (soundEnabled = !isMuted)
      const soundEnabled = storedPreference === 'true';
      setIsMuted(!soundEnabled);
    }
  });

  // Toggle mute state and persist to localStorage
  const toggleMute = () => {
    const newMutedState = !isMuted();
    setIsMuted(newMutedState);

    // Store as soundEnabled (opposite of muted)
    const soundEnabled = !newMutedState;
    localStorage.setItem(SOUND_ENABLED_KEY, String(soundEnabled));
  };

  // Play a sound (checks mute state internally)
  const playSound = (soundType: SoundType) => {
    playSoundFromManager(soundType, isMuted());
  };

  const contextValue: SoundContextType = {
    isMuted,
    toggleMute,
    playSound,
  };

  return (
    <SoundContext.Provider value={contextValue}>
      {props.children}
    </SoundContext.Provider>
  );
};

// Hook to consume the context
export function useSound(): SoundContextType {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundContextProvider');
  }
  return context;
}
