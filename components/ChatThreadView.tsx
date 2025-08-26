
import React, { useState, useEffect, useRef } from 'react';
import { type ChatConversation, type ChatMessage, type TelegramUser, type Ad } from '../types';
import { getMessagesForConversation, sendMessage, sendMessageWithImage, analyzeChatMessageForScam, updateAdStatus, respondToOffer, updateSecureDealStatus } from '../backend/api';
import Spinner from './Spinner';
import { formatPrice } from '../utils/formatters';

interface ChatThreadViewProps {
    conversation: ChatConversation;
    currentUser: TelegramUser;
    ads: Ad[];
    refreshAds: () => void;
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SystemMessage: React.FC<{ msg: ChatMessage, currentUser: TelegramUser, onAction: () => void, refreshAds: () => void }> = ({ msg, currentUser, onAction, refreshAds }) => {
    const handleOfferResponse = async (accepted: boolean) => {
        await respondToOffer(msg.id, accepted);
        onAction(); // Refetch messages
    };

    const handleDealUpdate = async (newStatus: 'shipping_pending' | 'delivery_pending' | 'completed') => {
        await updateSecureDealStatus(msg.id, newStatus);
        if (newStatus === 'completed' && msg.secureDealDetails?.adId) {
            await updateAdStatus(msg.secureDealDetails.adId, 'sold');
            refreshAds();
        }
        onAction();
    };

    if (msg.offerDetails) {
        const isSeller = msg.receiverId === currentUser.id;
        const offer = msg.offerDetails;
        return (
            <div className="text-center my-2">
                <div className="inline-block bg-tg-bg text-tg-hint text-sm p-2 rounded-lg">
                    {isSeller ? `Покупець запропонував ${formatPrice(offer.price)}` : `Ви запропонували ${formatPrice(offer.price)}`}
                    {offer.status === 'pending' && isSeller && (
                        <div className="flex gap-2 mt-2 justify-center">
                            <button onClick={() => handleOfferResponse(true)} className="bg-green-500/80 text-white text-xs font-bold py-1 px-3 rounded-lg">Прийняти</button>
                            <button onClick={() => handleOfferResponse(false)} className="bg-red-500/80 text-white text-xs font-bold py-1 px-3 rounded-lg">Відхилити</button>
                        </div>
                    )}
                    {offer.status === 'accepted' && <span className="text-green-400 block mt-1">Пропозицію прийнято!</span>}
                    {offer.status === 'declined' && <span className="text-red-400 block mt-1">Пропозицію відхилено.</span>}
                </div>
            </div>
        );
    }
    
    if (msg.secureDealDetails) {
        const deal = msg.secureDealDetails;
        const isSeller = currentUser.id === msg.secureDealDetails.sellerId;
        const isBuyer = currentUser.id === msg.secureDealDetails.buyerId;

        let statusText = "Безпечна угода розпочата.";
        if (deal.status === 'shipping_pending') statusText = "Продавець підтвердив угоду. Очікується відправка.";
        if (deal.status === 'delivery_pending') statusText = "Товар відправлено. Очікуйте на доставку.";
        if (deal.status === 'completed') statusText = "Угоду завершено!";

        return (
             <div className="text-center my-2">
                <div className="inline-block bg-tg-bg text-tg-hint text-sm p-3 rounded-lg">
                    <p className="font-semibold mb-2">Безпечна угода</p>
                    <p>{statusText}</p>
                    {isSeller && deal.status === 'payment_pending' && (
                        <button onClick={() => handleDealUpdate('shipping_pending')} className="bg-tg-link text-white text-xs font-bold py-1 px-3 rounded-lg mt-2">Підтвердити угоду</button>
                    )}
                     {isSeller && deal.status === 'shipping_pending' && (
                        <button onClick={() => handleDealUpdate('delivery_pending')} className="bg-tg-link text-white text-xs font-bold py-1 px-3 rounded-lg mt-2">Підтвердити відправку</button>
                    )}
                     {isBuyer && deal.status === 'delivery_pending' && (
                        <button onClick={() => handleDealUpdate('completed')} className="bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-lg mt-2">Я отримав(ла) товар</button>
                    )}
                </div>
            </div>
        )
    }

    return null;
}


const ChatThreadView: React.FC<ChatThreadViewProps> = ({ conversation, currentUser, ads, refreshAds }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [scamWarning, setScamWarning] = useState<string | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    const relevantAd = ads.find(ad => ad.id === conversation.adId);
    
    const fetchMessages = () => {
         getMessagesForConversation(currentUser.id, conversation.participant.id)
            .then(initialMessages => {
                setMessages(initialMessages);
                analyzeChatMessageForScam(initialMessages).then(setScamWarning);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        setIsLoading(true);
        fetchMessages();
    }, [currentUser.id, conversation.participant.id]);

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        const tempMessage = newMessage;
        setNewMessage('');

        try {
            const sentMessage = await sendMessage(currentUser.id, conversation.participant.id, tempMessage, conversation.adId);
            const updatedMessages = [...messages, sentMessage];
            setMessages(updatedMessages);
            analyzeChatMessageForScam(updatedMessages).then(setScamWarning);
        } catch (error) {
            console.error("Failed to send message", error);
            // Optionally, show an error and restore the input field
            setNewMessage(tempMessage);
        }
    };
    
    const handleImageSend = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const dataUrl = await fileToDataUrl(file);
            const sentMessage = await sendMessageWithImage(currentUser.id, conversation.participant.id, dataUrl, conversation.adId);
            setMessages(prev => [...prev, sentMessage]);
        } catch (error) {
            console.error("Failed to send image", error);
        }
    };

    const handleReserve = async () => {
        if (!relevantAd) return;
        try {
            await updateAdStatus(relevantAd.id, 'reserved');
            refreshAds();
            // Optionally send a system message
        } catch (error) {
            console.error("Failed to reserve ad", error);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto bg-tg-secondary-bg rounded-lg shadow-xl">
            <header className="p-4 border-b border-tg-border flex items-center justify-between">
                <div className="flex items-center">
                    <img src={conversation.participant.avatarUrl} alt={conversation.participant.name} className="w-10 h-10 rounded-full mr-3" />
                    <h2 className="text-lg font-bold">{conversation.participant.name}</h2>
                </div>
                {relevantAd && relevantAd.seller.id === currentUser.id && relevantAd.status === 'active' && (
                    <button onClick={handleReserve} className="bg-yellow-500/80 text-white text-xs font-bold py-1 px-3 rounded-lg hover:bg-yellow-600">
                        Поставити в резерв
                    </button>
                )}
            </header>

            {scamWarning && (
                <div className="p-2 bg-red-500/20 text-red-400 text-sm text-center border-b border-red-500/30">
                    <p><strong>Увага!</strong> {scamWarning}</p>
                </div>
            )}

            <main className="flex-grow p-4 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <div className="space-y-1">
                        {messages.map(msg => 
                            msg.isSystemMessage ? (
                                <SystemMessage key={msg.id} msg={msg} currentUser={currentUser} onAction={fetchMessages} refreshAds={refreshAds} />
                            ) : (
                            <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-sm p-1 rounded-lg ${msg.senderId === currentUser.id ? 'bg-tg-button text-white' : 'bg-tg-secondary-bg-hover'}`}>
                                    {msg.imageUrl ? (
                                        <img src={msg.imageUrl} alt="Надіслане зображення" className="rounded-md max-w-full h-auto" />
                                    ) : (
                                        <p className="px-2 py-1">{msg.text}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            <footer className="p-4 border-t border-tg-border">
                <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-tg-bg rounded-lg border border-tg-border text-tg-hint hover:text-tg-link">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSend} />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Написати повідомлення..."
                        className="flex-grow bg-tg-bg p-3 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-tg-button text-tg-button-text font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-500"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default ChatThreadView;
