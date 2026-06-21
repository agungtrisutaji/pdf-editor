import type { CSSProperties } from "react";

export type StampPreset = {
  label: "APPROVED" | "REVIEWED" | "REJECTED" | "CONFIDENTIAL";
  color: string;
};

type StampPickerProps = {
  disabled: boolean;
  onStampSelected: (preset: StampPreset) => void;
};

const STAMP_PRESETS: StampPreset[] = [
  { label: "APPROVED", color: "#15803d" },
  { label: "REVIEWED", color: "#1d4ed8" },
  { label: "REJECTED", color: "#b91c1c" },
  { label: "CONFIDENTIAL", color: "#7c2d12" },
];

export function StampPicker({ disabled, onStampSelected }: StampPickerProps) {
  return (
    <section className="stamp-picker" aria-label="Stamp presets">
      <h2>Stamp</h2>
      <div className="stamp-preset-grid">
        {STAMP_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="stamp-preset-button"
            disabled={disabled}
            onClick={() => onStampSelected(preset)}
            style={{ "--stamp-color": preset.color } as CSSProperties}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <p className="helper-text">Preset stamps, kept in memory only.</p>
    </section>
  );
}
