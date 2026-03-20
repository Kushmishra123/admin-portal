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
  className = '',
  style = {},
  type = 'button',
  loadingText = null,
  showSpinner = true,
  ...rest
}) => {
  const { isLoading, withLoader } = useLoader();
  const [localLoading, setLocalLoading] = React.useState(false);

  const isActive = localLoading || isLoading;
  const isDisabled = disabled || isActive;

  const handleClick = async (e) => {
    if (!onClick || isDisabled) return;

    const result = onClick(e);

    // Only wrap in loader if onClick returns a Promise (i.e. it's async)
    if (result && typeof result.then === 'function') {
      setLocalLoading(true);
      try {
        await result;
      } finally {
        setLocalLoading(false);
      }
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
        position: 'relative',
        ...(isActive ? { pointerEvents: 'none' } : {}),
      }}
      disabled={isDisabled}
      onClick={handleClick}
      {...rest}
    >
      {isActive && showSpinner && (
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
      {isActive && loadingText ? loadingText : children}
    </button>
  );
};

export default LoaderButton;
