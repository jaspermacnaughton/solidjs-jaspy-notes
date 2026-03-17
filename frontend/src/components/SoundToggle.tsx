import { useSound } from '../context/SoundContext';

export default function SoundToggle() {
  const sound = useSound();

  return (
    <span
      class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded p-1"
      onClick={() => sound.toggleMute()}
      title={sound.isMuted() ? 'Unmute sounds' : 'Mute sounds'}
    >
      {sound.isMuted() ? 'volume_off' : 'volume_up'}
    </span>
  );
}
