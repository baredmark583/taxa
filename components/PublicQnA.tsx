import React, { useState, useEffect } from 'react';
import { type Ad, type Question, type TelegramUser } from '../types';
import { getQuestionsForAd, postQuestion, postAnswer } from '../backend/api';
import Spinner from './Spinner';
import { formatRelativeDate } from '../utils/formatters';

interface PublicQnAProps {
  ad: Ad;
  currentUser: TelegramUser;
}

const PublicQnA: React.FC<PublicQnAProps> = ({ ad, currentUser }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
    const [isPosting, setIsPosting] = useState(false);
    
    const isOwner = ad.seller.id === currentUser.id;

    const fetchQuestions = async () => {
        setIsLoading(true);
        const fetchedQuestions = await getQuestionsForAd(ad.id);
        setQuestions(fetchedQuestions);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchQuestions();
    }, [ad.id]);

    const handlePostQuestion = async () => {
        if (!newQuestion.trim()) return;
        setIsPosting(true);
        try {
            await postQuestion(ad.id, newQuestion, currentUser);
            setNewQuestion('');
            await fetchQuestions(); // Refetch to show new question
        } finally {
            setIsPosting(false);
        }
    };

    const handlePostAnswer = async (questionId: string) => {
        const text = answerText[questionId];
        if (!text || !text.trim()) return;
        setIsPosting(true);
        try {
            await postAnswer(questionId, text, currentUser);
            setAnswerText(prev => ({ ...prev, [questionId]: '' }));
            await fetchQuestions(); // Refetch to show new answer
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="mt-6 border-t border-tg-border pt-6">
            <h2 className="text-xl font-semibold mb-4">Запитання та відповіді</h2>

            {isLoading ? (
                <div className="flex justify-center"><Spinner /></div>
            ) : (
                <div className="space-y-4">
                    {questions.map(q => (
                        <div key={q.id} className="bg-tg-bg p-3 rounded-lg">
                            <div className="flex items-start">
                                <img src={q.authorAvatarUrl} alt={q.authorName} className="w-8 h-8 rounded-full mr-3 mt-1" />
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-semibold">{q.authorName}</p>
                                        <p className="text-xs text-tg-hint">{formatRelativeDate(q.createdAt)}</p>
                                    </div>
                                    <p className="text-tg-text">{q.text}</p>
                                    
                                    {q.answer ? (
                                        <div className="mt-2 flex items-start border-l-2 border-tg-border pl-3 ml-1 pt-1">
                                            <img src={ad.seller.avatarUrl} alt={ad.seller.name} className="w-6 h-6 rounded-full mr-2 mt-1" />
                                            <div>
                                                 <div className="flex items-baseline gap-2">
                                                    <p className="font-semibold text-sm">{ad.seller.name}</p>
                                                    <p className="text-xs text-tg-hint">{formatRelativeDate(q.answer.createdAt)}</p>
                                                </div>
                                                <p className="text-sm text-tg-hint">{q.answer.text}</p>
                                            </div>
                                        </div>
                                    ) : isOwner && (
                                        <div className="mt-2 flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Ваша відповідь..."
                                                value={answerText[q.id] || ''}
                                                onChange={e => setAnswerText(prev => ({...prev, [q.id]: e.target.value}))}
                                                className="flex-grow bg-tg-secondary-bg-hover text-sm p-2 rounded-lg border border-tg-border focus:outline-none focus:ring-1 focus:ring-tg-link"
                                            />
                                            <button onClick={() => handlePostAnswer(q.id)} disabled={isPosting} className="bg-tg-link text-white font-semibold text-sm py-2 px-3 rounded-lg disabled:opacity-50">Надіслати</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {questions.length === 0 && <p className="text-center text-tg-hint text-sm">Поки що немає запитань. Будьте першим!</p>}
                </div>
            )}

            {!isOwner && (
                <div className="mt-4 flex gap-2">
                    <input
                        type="text"
                        placeholder="Поставте своє запитання..."
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        className="flex-grow bg-tg-secondary-bg-hover p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                    />
                    <button onClick={handlePostQuestion} disabled={isPosting} className="bg-tg-button text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">
                        {isPosting ? <Spinner size="sm" /> : "Запитати"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PublicQnA;
