import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import Spinner from '../components/Spinner';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, name });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-tg-secondary-bg rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-center text-tg-text">
          {isLogin ? 'Вхід у Taxa AI' : 'Реєстрація'}
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label htmlFor="name" className="text-sm font-medium text-tg-hint">
                Ім'я
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 mt-1 bg-tg-bg border border-tg-border rounded-md focus:outline-none focus:ring-2 focus:ring-tg-link"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-tg-hint">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 bg-tg-bg border border-tg-border rounded-md focus:outline-none focus:ring-2 focus:ring-tg-link"
            />
          </div>
          <div>
            <label htmlFor="password"className="text-sm font-medium text-tg-hint">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 bg-tg-bg border border-tg-border rounded-md focus:outline-none focus:ring-2 focus:ring-tg-link"
            />
          </div>
          {error && <p className="text-sm text-center text-red-400">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 font-semibold text-tg-button-text bg-tg-button rounded-md hover:bg-opacity-90 flex items-center justify-center disabled:bg-gray-500"
            >
              {isLoading ? <Spinner size="sm" /> : (isLogin ? 'Увійти' : 'Створити акаунт')}
            </button>
          </div>
        </form>
        <div className="text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-sm text-tg-link hover:underline">
            {isLogin ? 'Немає акаунту? Зареєструватись' : 'Вже є акаунт? Увійти'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
