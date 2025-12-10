'use client';
import { Button } from "@/components/ui/button";
import { COMMON_STYLES } from "../constants";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormField({ label, children, error, required, className = "" }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className={`${COMMON_STYLES.TEXT_AMBER_SECONDARY} text-sm font-medium block`}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

interface TextInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  min?: number;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function TextInput({ 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  min,
  disabled = false,
  error = false,
  className = ""
}: TextInputProps) {
  const baseClass = disabled ? COMMON_STYLES.DISABLED_INPUT_CLASS : COMMON_STYLES.INPUT_CLASS;
  const errorClass = error ? 'border-red-500 focus:ring-red-500' : '';
  
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      disabled={disabled}
      className={`${baseClass} ${errorClass} ${className}`}
    />
  );
}

interface NumberInputProps {
  value: number | "";
  onChange: (value: number | "") => void;
  placeholder?: string;
  min?: number;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function NumberInput({ 
  value, 
  onChange, 
  placeholder, 
  min = 0,
  disabled = false,
  error = false,
  className = ""
}: NumberInputProps) {
  const baseClass = disabled ? COMMON_STYLES.DISABLED_INPUT_CLASS : COMMON_STYLES.INPUT_CLASS;
  const errorClass = error ? 'border-red-500 focus:ring-red-500' : '';
  
  const handleChange = (val: string) => {
    if (val === '') {
      onChange('');
    } else {
      const num = Number(val);
      if (!isNaN(num) && num >= min) {
        onChange(num);
      }
    }
  };

  return (
    <input
      type="number"
      value={value === "" ? "" : value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      disabled={disabled}
      className={`${baseClass} ${errorClass} ${className}`}
    />
  );
}

interface LoadingButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  type?: 'button' | 'submit';
}

export function LoadingButton({ 
  onClick, 
  loading = false, 
  disabled = false, 
  children, 
  variant = 'primary',
  className = "",
  type = 'button'
}: LoadingButtonProps) {
  const variantClass = variant === 'primary' ? COMMON_STYLES.BUTTON_PRIMARY : COMMON_STYLES.BUTTON_SECONDARY;
  
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variantClass} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}
        </div>
      ) : (
        children
      )}
    </Button>
  );
}