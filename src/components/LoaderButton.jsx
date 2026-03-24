import React from 'react';
import { useLoader } from '../context/LoaderContext';

/**
 * LoaderButton — a smart button that:
 * - Shows a spinner when itself OR the global loader is active
 * - Disables ALL LoaderButtons while any one is loading
 * - Works as a drop-in replacement for <button>
 *
 * Usage:
 *   <LoaderButton onClick={handleApiCall} className="btn-primary">
 *     Submit
 *   </LoaderButton>
 *
 * onClick can be a regular or async function.
 * If it returns a Promise, the button will stay in loading state until it resolves.
 */
const LoaderButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  style = {},
  type = 'button',
  loadingText = null,
  showSpinner = true,
  ...rest
}) => {
  const { isLoading, setIsLoading } = useLoader();
  const [localLoading, setLocalLoading] = React.useState(false);

  const effectiveLoading = localLoading || loading;
  const isDisabled = disabled || isLoading || effectiveLoading;

  const handleClick = async (e) => {
    if (!onClick) return;
    if (isDisabled) { e.preventDefault(); return; }

    if (type === 'submit' && e.currentTarget.form) {
      // Prevent native submission only if we are taking over with onClick.
      e.preventDefault();
      
      // Native validation check
      if (!e.currentTarget.form.reportValidity()) {
        return;
      }
    }

    try {
      const result = onClick(e);
      if (result && typeof result.then === 'function') {
        setLocalLoading(true);
        setIsLoading?.(true);
        try {
          await result;
        } finally {
          setLocalLoading(false);
          setIsLoading?.(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLocalLoading(false);
      setIsLoading?.(false);
    }
  };

  return (
    <button
      type={type}
      className={className}
      style={{
        ...style,
        opacity: isDisabled ? 0.65 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        ...(effectiveLoading ? { pointerEvents: 'none' } : {}),
      }}
      disabled={isDisabled}
      onClick={handleClick}
      {...rest}
    >
      {effectiveLoading && showSpinner && (
        <span
          className="btn-spinner"
          style={{
            display: 'inline-block',
            width: 13,
            height: 13,
            border: '2.5px solid currentColor',
            borderLeftColor: 'transparent',
            borderRadius: '50%',
            animation: 'btn-spin 0.7s linear infinite',
            marginRight: 7,
            verticalAlign: 'middle',
            flexShrink: 0,
          }}
        />
      )}
      {effectiveLoading && loadingText ? loadingText : children}
    </button>
  );
};

export default LoaderButton;
