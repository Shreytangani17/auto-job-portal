import React, { useState } from 'react';

interface AuthFormProps {
  onGoogleSignIn: () => void;
  onEmailSignIn: (email: string, password: string) => void;
  onEmailSignUp: (email: string, password: string) => void;
  error?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ onGoogleSignIn, onEmailSignIn, onEmailSignUp, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      onEmailSignUp(email, password);
    } else {
      onEmailSignIn(email, password);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
        >
          {isSignUp ? 'Sign Up with Email' : 'Sign In with Email'}
        </button>
      </form>
      <div className="my-4 text-center text-gray-500">or</div>
      <button
        onClick={onGoogleSignIn}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center"
        type="button"
      >
        <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.45 2.36 30.68 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.2C12.13 13.16 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.74H24v9.01h12.44c-.54 2.9-2.18 5.36-4.64 7.01l7.19 5.6C43.98 37.13 46.1 31.3 46.1 24.5z"/><path fill="#FBBC05" d="M10.67 28.64A14.5 14.5 0 019.5 24c0-1.6.27-3.15.77-4.64l-7.98-6.2A23.93 23.93 0 000 24c0 3.77.9 7.34 2.49 10.44l8.18-5.8z"/><path fill="#EA4335" d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7.19-5.6c-2.01 1.35-4.59 2.15-8.7 2.15-6.38 0-11.87-3.66-14.33-8.94l-8.18 5.8C6.73 42.52 14.82 48 24 48z"/></g></svg>
        Sign In with Google
      </button>
      <div className="mt-6 text-center">
        <button
          type="button"
          className="text-blue-600 hover:underline"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm; 