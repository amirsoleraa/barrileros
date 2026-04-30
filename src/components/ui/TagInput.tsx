import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = 'Agregar...' }: TagInputProps) {
  const [value, setValue] = useState('');

  function add() {
    const v = value.trim();
    if (v && !tags.includes(v)) {
      onChange([...tags, v]);
    }
    setValue('');
  }

  function remove(idx: number) {
    onChange(tags.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="tag-input-row">
        <input
          className="s-input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          style={{ flex: 1 }}
        />
        <button className="btn-add" onClick={add} type="button" style={{ padding: '10px 14px' }}>
          <Plus size={16} />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="tag-list">
          {tags.map((tag, i) => (
            <span key={i} className="tag-item">
              {tag}
              <button type="button" onClick={() => remove(i)}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
