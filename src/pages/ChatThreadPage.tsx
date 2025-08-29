import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage, getAdById } from '../apiClient';
import { ChatMessage, AuthUser, Ad } from '../types';
import Spinner from '../components/Spinner';
import { Icon } from '@iconify/react';
import { useI18n } from '../I18nContext';
import { resolveImageUrl } from '../utils/formatters';
import { useAuth } from '../AuthContext';


interface ChatThreadPageProps {}

const ChatThreadPage: React.FC<ChatThreadPageProps> = () => {
    const { adId, participantId } = useParams<{ adId: string, participantId: string }>();
    const { user: currentUser } = useAuth();
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [adInfo, setAdInfo] = useState<Ad | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const ws = useRef<WebSocket | null>(null);
    const { t } = useI18n();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!adId || !participantId || !currentUser) return;
        
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [messagesRes, adRes] = await Promise.all([
                    getMessages(adId, participantId),
                    getAdById(adId)
                ]);
                setMessages(messagesRes.data);
                setAdInfo(adRes.data);
            } catch (err) {
                setError('Не вдалося завантажити дані чату.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
        
        // --- WebSocket Setup ---
        const getWsUrl = () => {
            const apiUrl = (import.meta as any).env.VITE_API_BASE_URL;
            if (apiUrl) {
                const url = new URL(apiUrl);
                url.protocol = url.protocol === 'https:' ? 'wss' : 'ws';
                return url.toString();
            }
            return 'ws://localhost:3001';
        };

        ws.current = new WebSocket(getWsUrl());
        ws.current.onopen = () => {
            console.log('WebSocket connected');
            if (currentUser.token) ws.current?.send(JSON.stringify({ type: 'auth', token: currentUser.token }));
        };
        ws.current.onmessage = (event) => {
            try {
                const messageData = JSON.parse(event.data);
                if (messageData.type === 'new_message') {
                    const receivedMessage: ChatMessage = messageData.payload;
                    const isRelevant = receivedMessage.adId === adId && receivedMessage.senderId === participantId && receivedMessage.receiverId === currentUser.id;
                    if (isRelevant) setMessages(prev => [...prev, receivedMessage]);
                }
            } catch (e) { console.error("Failed to parse WebSocket message:", e); }
        };
        ws.current.onclose = () => console.log('WebSocket disconnected');
        ws.current.onerror = (error) => console.error('WebSocket error:', error);
        return () => { ws.current?.close(); };

    }, [adId, participantId, currentUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending || !adId || !participantId || !currentUser) return;

        setIsSending(true);
        const optimisticMessage: ChatMessage = {
            id: `temp-${Date.now()}`, text: newMessage, senderId: currentUser.id, receiverId: participantId, adId, createdAt: new Date().toISOString(), isRead: false,
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        try {
            const response = await sendMessage(adId, participantId, newMessage.trim());
            setMessages(prev => prev.map(msg => msg.id === optimisticMessage.id ? response.data : msg));
        } catch (err) {
            console.error("Failed to send message:", err);
            setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
            setNewMessage(optimisticMessage.text || '');
            setError("Не вдалося відправити повідомлення.");
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading || !adInfo || !currentUser) {
         return <div className="flex justify-center items-center h-full"><Spinner /></div>
    }

    const participant = adInfo.seller.id === currentUser.id ? null /* Or buyer info if available */ : adInfo.seller;
    const participantName = participant ? participant.name : 'Учасник';

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)]">
            <div className="p-2 border-b border-tg-border bg-tg-secondary-bg flex items-center">
                <img src={resolveImageUrl(adInfo.imageUrls[0] || 'https://placehold.co/100')} alt={adInfo.title} className="w-12 h-12 rounded-md object-cover"/>
                <div className="ml-3 overflow-hidden">
                    <p className="font-bold text-sm truncate">{adInfo.title}</p>
                    <p className="text-xs text-tg-hint">{t('chatThread.chatWith')} {participantName}</p>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {error && <p className="text-center text-red-400">{error}</p>}
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-tg-button text-tg-button-text rounded-br-none' : 'bg-tg-secondary-bg-hover rounded-bl-none'}`}>
                            <p className="text-base whitespace-pre-wrap break-words">{msg.text}</p>
                            <p className={`text-xs mt-1 opacity-70 ${msg.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                       </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-2 border-t border-tg-border bg-tg-secondary-bg flex items-center">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t('chatThread.messagePlaceholder')} className="w-full bg-tg-bg p-3 rounded-full border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none" disabled={isSending}/>
                <button type="submit" className="ml-2 p-3 bg-tg-button rounded-full text-tg-button-text disabled:opacity-50" disabled={isSending || !newMessage.trim()}><Icon icon="lucide:send" className="h-6 w-6" /></button>
            </form>
        </div>
    );
};

export default ChatThreadPage;