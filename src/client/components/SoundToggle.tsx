interface SoundToggleProps {
  muted: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ muted, onToggle }: SoundToggleProps) {
  return (
    <button
      className="sound-toggle"
      onClick={onToggle}
      title={muted ? 'Sound Off' : 'Sound On'}
      aria-label={muted ? 'Enable sound' : 'Disable sound'}
    >
      {muted ? '\u{1F507}' : '\u{1F509}'}
    </button>
  );
}
