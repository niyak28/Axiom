export default function RaiseHand({ isRaised, onToggle, disabled = false }) {
  return (
    <button
      className={`outline-button raise-hand ${isRaised ? "is-active" : ""}`}
      type="button"
      disabled={disabled}
      aria-pressed={isRaised}
      onClick={onToggle}
    >
      <span className="raise-icon" aria-hidden="true">{isRaised ? "×" : "↑"}</span>
      {isRaised ? "Lower Hand" : "Raise Hand"}
    </button>
  );
}
