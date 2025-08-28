import React, { useState, useEffect } from 'react';
import { getConversations } from '../apiClient';
import { ChatConversation, ChatContext } from '../types';
import Spinner from '../components/Spinner';
import { Icon } from '@iconify/react';
import { formatRelativeDate, resolveImageUrl } from '../utils/formatters';
// FIX: Passed the translation function `t` to `formatRelativeDate` to fix a missing argument error.
import { useI18n } from '../I18nContext';

interface ChatListPageProps {
    onViewChat: (context: ChatContext) => void;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ onViewChat }) => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useI18n();

    useEffect(() => {
        const fetchConversations = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await getConversations();
                setConversations(response.data);
            } catch (err) {
                setError('Не вдалося завантажити чати.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConversations();
    }, []);

    const handleConversationClick = (convo: ChatConversation) => {
        onViewChat({
            adId: convo.adId,
            adTitle: convo.adTitle,
            adImageUrl: convo.adImageUrls[0],
            participantId: convo.participantId,
            participantName: convo.participantName
        });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    if (error) {
        return <p className="text-center text-red-400 mt-8">{error}</p>;
    }

    return (
        <div className="space-y-2">
            {conversations.length > 0 ? (
                conversations.map(convo => (
                    <button 
                        key={`${convo.adId}-${convo.participantId}`} 
                        onClick={() => handleConversationClick(convo)}
                        className="w-full flex items-center p-3 bg-tg-secondary-bg rounded-lg hover:bg-tg-secondary-bg-hover transition-colors text-left"
                    >
                        <img 
                            src={resolveImageUrl(convo.participantAvatarUrl || `https://i.pravatar.cc/150?u=${convo.participantId}`)} 
                            alt={convo.participantName}
                            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="ml-4 flex-grow overflow-hidden">
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-tg-text truncate">{convo.participantName}</p>
                                <p className="text-xs text-tg-hint flex-shrink-0 ml-2">{formatRelativeDate(convo.lastMessageAt, t)}</p>
                            </div>
                            <p className="text-sm text-tg-hint truncate">{convo.adTitle}</p>
                            <p className="text-sm text-tg-text truncate mt-1">{convo.lastMessageText}</p>
                        </div>
                    </button>
                ))
            ) : (
                <div className="text-center text-tg-hint mt-12 flex flex-col items-center">
                    <Icon icon="lucide:message-square-off" className="h-20 w-20 text-tg-border" />
                    <p className="text-lg mt-4">У вас ще немає чатів</p>
                    <p className="text-sm mt-1">Почніть розмову, відповівши на оголошення.</p>
                </div>
            )}
        </div>
    );
};

export default ChatListPage;