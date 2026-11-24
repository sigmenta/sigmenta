// ─── Input Component ──────────────────────────────────────────────────────────
import React, { useId } from 'react';

type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time';

interface BaseInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  floatingLabel?: boolean;
  fullWidth?: boolean;
  wrapperClassName?: string;
}

export interface InputProps
  extends BaseInputProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  as?: 'input';
  type?: InputType;
}

export interface TextareaProps
  extends BaseInputProps,
    React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: 'textarea';
  rows?: number;
}

type CombinedInputProps = InputProps | TextareaProps;

const Input = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  CombinedInputProps
>((props, ref) => {
  const uid = useId();
  const {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    floatingLabel = false,
    fullWidth = false,
    wrapperClassName = '',
    className = '',
  } = props;

  const inputId = `input-${uid}`;
  const errorId = `error-${uid}`;
  const hintId = `hint-${uid}`;

  const descBy = [error ? errorId : '', hint ? hintId : '']
    .filter(Boolean)
    .join(' ') || undefined;

  const baseInputClasses = [
    'w-full rounded-xl border bg-white text-[#292329] text-sm placeholder:text-[#77717A]/70',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-[#D45D83]/40 focus:border-[#D45D83]',
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-400/30'
      : 'border-[#F0E2E8] hover:border-[#D45D83]/60',
    leftIcon ? 'pl-10' : 'pl-3.5',
    rightIcon ? 'pr-10' : 'pr-3.5',
    'py-2.5',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderField = () => {
    if (props.as === 'textarea') {
      const { as: _as, label: _l, error: _e, hint: _h, leftIcon: _li, rightIcon: _ri,
        floatingLabel: _fl, fullWidth: _fw, wrapperClassName: _wc, className: _cls,
        rows = 4, ...rest } = props;
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={inputId}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={descBy}
          className={[baseInputClasses, 'resize-y min-h-[100px]'].join(' ')}
          {...rest}
        />
      );
    }

    const { as: _as, label: _l, error: _e, hint: _h, leftIcon: _li, rightIcon: _ri,
      floatingLabel: _fl, fullWidth: _fw, wrapperClassName: _wc, className: _cls,
      type = 'text', ...rest } = props as InputProps;
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        id={inputId}
        type={type}
        aria-invalid={!!error}
        aria-describedby={descBy}
        className={baseInputClasses}
        {...rest}
      />
    );
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${wrapperClassName}`}>
      {label && !floatingLabel && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#292329] mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77717A] pointer-events-none">
            {leftIcon}
          </span>
        )}

        {renderField()}

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77717A]">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-[#77717A]">
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
