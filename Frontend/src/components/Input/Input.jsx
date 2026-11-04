import React, { useState } from "react";
import "./Input.css";

function Input({
  label,
  type = "text",
  placeholder,
  register,
  name,
  errors,
  icon: IconComponent,
  required = false
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;
  const hasError = Boolean(errors && errors[name]);

  return (
    <div className={`input-group ${hasError ? "input-group-error" : ""}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="required-star">*</span>}
      </label>

      <div className="input-wrapper">
        {IconComponent && (
          <span className="input-icon">
            <IconComponent width="18" height="18" />
          </span>
        )}

        <input
          id={name}
          type={actualType}
          placeholder={placeholder}
          className={`${IconComponent ? "has-icon" : ""} ${isPassword ? "has-toggle" : ""}`}
          {...register(name)}
        />

        {isPassword && (
          <button
            type="button"
            className="toggle-password-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {hasError && (
        <span className="error-message">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errors[name].message}
        </span>
      )}
    </div>
  );
}

export default Input;