import React from 'react';

// A simple SVG icon for Telegram
const TelegramIcon = () => (
    <svg viewBox="0 0 48 48" className="w-12 h-12">
        <path fill="#29B6F6" d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4z"></path>
        <path fill="#FFF" d="M34 14l-4.408 19.116c-.246 1.06-1.002 1.34-1.892.834L20 28l-4 4-1-6 19-12-15 11-1-6z"></path>
    </svg>
);


const AuthPage: React.FC = () => {
    // IMPORTANT: Replace this with your actual bot's username
    const botUsername = "taxa_ai_bot";

    return (
        <div className="flex items-center justify-center min-h-screen p-4 animate-modal-fade-in">
            <div className="w-full max-w-md p-8 space-y-6 bg-tg-secondary-bg rounded-lg shadow-xl text-center">
                <div className="flex justify-center mb-4">
                    <TelegramIcon />
                </div>
                <h2 className="text-2xl font-bold text-tg-text">
                    Вітаємо у Taxa AI
                </h2>
                <p className="text-tg-hint">
                    Для доступу до всіх функцій, будь ласка, відкрийте цей додаток через нашого Telegram-бота.
                </p>
                <p className="text-tg-hint text-sm">
                    Якщо ви вже у Telegram, спробуйте перезапустити додаток.
                </p>
                <div>
                    <a
                        href={`https://t.me/${botUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center px-4 py-3 font-semibold text-tg-button-text bg-tg-button rounded-md hover:bg-opacity-90 transition-transform hover:scale-105"
                    >
                        Перейти до бота
                    </a>
                </div>
                <p className="text-xs text-tg-hint pt-4">
                    Натискаючи "Перейти до бота", ви будете перенаправлені до Telegram для авторизації.
                </p>
            </div>
        </div>
    );
};

export default AuthPage;