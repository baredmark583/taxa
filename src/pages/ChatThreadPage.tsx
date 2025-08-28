import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage } from '../apiClient';
import { ChatContext, ChatMessage, AuthUser } from '../types';
import Spinner from '../components/Spinner';
import { Icon } from '@iconify/react';
import { formatRelativeDate } from '../utils/formatters';

interface ChatThreadPageProps {
    context: ChatContext;
    currentUser: AuthUser;
}

const ChatThreadPage: React.FC<ChatThreadPageProps> = ({ context, currentUser }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await getMessages(context.adId, context.participantId);
                setMessages(response.data);
            } catch (err) {
                setError('Не вдалося завантажити повідомлення.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [context]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        const optimisticMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            text: newMessage,
            senderId: currentUser.id,
            receiverId: context.participantId,
            adId: context.adId,
            createdAt: new Date().toISOString(),
            isRead: false,
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        try {
            const response = await sendMessage(context.adId, context.participantId, newMessage.trim());
            // Replace optimistic message with the real one from the server
            setMessages(prev => prev.map(msg => msg.id === optimisticMessage.id ? response.data : msg));
        } catch (err) {
            console.error("Failed to send message:", err);
            // Revert optimistic update
            setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
            setNewMessage(optimisticMessage.text || ''); // Put text back in input
            setError("Не вдалося відправити повідомлення.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)]">
            <div className="p-2 border-b border-tg-border bg-tg-secondary-bg flex items-center">
                <img src={context.adImageUrl || 'https://placehold.co/100'} alt={context.adTitle} className="w-12 h-12 rounded-md object-cover"/>
                <div className="ml-3">
                    <p className="font-bold text-sm truncate">{context.adTitle}</p>
                    <p className="text-xs text-tg-hint">Чат з {context.participantName}</p>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                {error && <p className="text-center text-red-400">{error}</p>}
                {!isLoading && messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-tg-button text-tg-button-text rounded-br-none' : 'bg-tg-secondary-bg-hover rounded-bl-none'}`}>
                            <p className="text-base">{msg.text}</p>
                            <p className={`text-xs mt-1 opacity-70 ${msg.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                       </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-2 border-t border-tg-border bg-tg-secondary-bg flex items-center">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напишіть повідомлення..."
                    className="w-full bg-tg-bg p-3 rounded-full border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                    disabled={isSending}
                />
                <button type="submit" className="ml-2 p-3 bg-tg-button rounded-full text-tg-button-text disabled:opacity-50" disabled={isSending || !newMessage.trim()}>
                    <Icon icon="lucide:send" className="h-6 w-6" />
                </button>
            </form>
        </div>
    );
};

export default ChatThreadPage;
