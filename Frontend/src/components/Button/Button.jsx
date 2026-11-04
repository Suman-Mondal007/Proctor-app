import "./Button.css";

function Button({
  text,
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  icon = null,
  variant = "primary",
  fullWidth = false,
}) {
  return (
    <button
      type={type}
      className={`btn ${variant} ${fullWidth ? "full-width" : ""}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="loader"></span>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {text}
        </>
      )}
    </button>
  );
}

export default Button;