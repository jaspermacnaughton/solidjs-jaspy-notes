import { useSound } from '../context/SoundContext';

export default function SoundToggle() {
  const sound = useSound();

  return (
    <span
      class="material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm"
      onClick={() => sound.toggleMute()}
      title={sound.isMuted() ? 'Unmute sounds' : 'Mute sounds'}
    >
      {sound.isMuted() ? 'volume_off' : 'volume_up'}
    </span>
  );
}
