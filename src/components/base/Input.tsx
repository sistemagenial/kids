
import { forwardRef, useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';

    return (
      <div className="relative">
        <input
          type={isPasswordField && showPassword ? 'text' : type}
          ref={ref}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
            </div>
          </button>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
