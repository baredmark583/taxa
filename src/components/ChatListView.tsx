import React, { useState, useEffect } from 'react';
import { type ChatConversation, type TelegramUser } from '../types';
import { getConversations } from '../backend/api';
import Spinner from './Spinner';
import { formatRelativeDate } from '../utils/formatters';

interface ChatListViewProps {
    currentUser: TelegramUser;
    onConversationSelect: (conversation: ChatConversation) => void;
}

const ChatListView: React.FC<ChatListViewProps> = ({ currentUser, onConversationSelect }) => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const convos = await getConversations(currentUser.id);
                setConversations(convos);
            } catch (err) {
                setError('Не вдалося завантажити чати.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [currentUser.id]);

    if (isLoading) {
        return <div className="flex justify-center mt-12"><Spinner size="lg" /></div>;
    }

    if (error) {
        return <p className="text-center text-red-400 mt-10">{error}</p>;
    }

    if (conversations.length === 0) {
        return <p className="text-center text-tg-hint mt-12">У вас поки немає активних чатів.</p>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-center">Чати</h1>
            <div className="bg-tg-secondary-bg rounded-lg shadow-xl">
                <ul className="divide-y divide-tg-border">
                    {conversations.map(convo => (
                        <li key={convo.id} onClick={() => onConversationSelect(convo)} className="p-4 flex items-center cursor-pointer hover:bg-tg-secondary-bg-hover transition-colors">
                            <img src={convo.participant.avatarUrl} alt={convo.participant.name} className="w-12 h-12 rounded-full mr-4" />
                            <div className="flex-grow">
                                <p className="font-bold">{convo.participant.name}</p>
                                <p className="text-sm text-tg-hint truncate">{convo.lastMessage.text}</p>
                            </div>
                            <div className="flex flex-col items-end ml-2">
                                <span className="text-xs text-tg-hint mb-1">{formatRelativeDate(convo.lastMessage.timestamp)}</span>
                                {convo.unreadCount > 0 && (
                                    <span className="bg-tg-link text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                        {convo.unreadCount}
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ChatListView;
