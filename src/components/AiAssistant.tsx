import React, { useState } from 'react';
import { type Ad } from '../types';
import { getAiAnswerForAd } from '../backend/api';
import Spinner from './Spinner';

interface AiAssistantProps {
  ad: Ad;
}

const suggestedQuestions = [
    "Чи можливий торг?",
    "Які розміри товару?",
    "Чи можлива доставка?",
];

const AiAssistant: React.FC<AiAssistantProps> = ({ ad }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (query?: string) => {
    const finalQuestion = query || question;
    if (!finalQuestion.trim()) return;

    setIsLoading(true);
    setAnswer(null);
    setError(null);

    try {
      const aiResponse = await getAiAnswerForAd(finalQuestion, ad);
      setAnswer(aiResponse);
    } catch (err: any) {
      setError(err.message || "Сталася помилка. Спробуйте знову.");
    } finally {
      setIsLoading(false);
      if (!query) {
        setQuestion('');
      }
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleAsk();
  }

  return (
    <div className="mt-6 border-t border-tg-border pt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-tg-link" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span>Запитати в AI-помічника</span>
      </h2>
      <div className="mb-4 flex flex-wrap gap-2">
          {suggestedQuestions.map(q => (
              <button 
                key={q} 
                onClick={() => handleAsk(q)}
                className="px-3 py-1 text-sm bg-tg-secondary-bg-hover rounded-full text-tg-link hover:bg-tg-border transition-colors"
              >
                  {q}
              </button>
          ))}
      </div>
      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Наприклад: 'Який матеріал?'"
          className="flex-grow bg-tg-secondary-bg-hover p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
          disabled={isLoading}
        />
        <button 
            type="submit" 
            disabled={isLoading || !question.trim()} 
            className="bg-tg-button text-tg-button-text font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center shrink-0 w-14"
            aria-label="Поставити запитання"
        >
          {isLoading ? <Spinner size="sm" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
      
      {error && <p className="text-red-400 mt-4">{error}</p>}
      
      {answer && (
        <div className="mt-4 p-4 bg-tg-secondary-bg-hover rounded-lg border border-tg-border">
            <p className="text-tg-text whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
