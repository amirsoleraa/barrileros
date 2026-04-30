interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function Toggle({ value, onChange, label }: ToggleProps) {
  return (
    <label className="toggle-wrap" style={{ cursor: 'pointer' }}>
      <div className={`tog-track ${value ? 'on' : ''}`} onClick={() => onChange(!value)}>
        <div className="tog-thumb" />
      </div>
      {label && <span style={{ fontSize: 14, color: 'var(--text)' }}>{label}</span>}
    </label>
  );
}
