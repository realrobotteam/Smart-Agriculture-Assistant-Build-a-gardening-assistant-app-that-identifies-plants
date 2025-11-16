import React, { useState, useEffect, useRef } from 'react';
import { createChat } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { ChatMessage } from '../types';
import Spinner from './Spinner';

const CHAT_HISTORY_KEY = 'smartAgricultureChatHistory';

const Chatbot: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      let session;
      try {
        const savedHistoryJSON = localStorage.getItem(CHAT_HISTORY_KEY);
        if (savedHistoryJSON && savedHistoryJSON !== '[]') {
          const savedHistory: ChatMessage[] = JSON.parse(savedHistoryJSON);
          setMessages(savedHistory);
          session = createChat(savedHistory);
        } else {
          setMessages([]); // Start with an empty message list
          session = createChat();
        }
      } catch (error) {
        console.error("خطا در پردازش تاریخچه چت. شروع یک جلسه جدید.", error);
        localStorage.removeItem(CHAT_HISTORY_KEY);
        setMessages([]); // Start fresh on error
        session = createChat();
      }
      setChatSession(session);
    };
    initChat();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } else {
      // If the chat is cleared, remove it from storage too
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !chatSession) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: userInput }] };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
        const result = await chatSession.sendMessageStream({ message: userInput });

        let modelResponse = '';
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

        for await (const chunk of result) {
            modelResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].parts[0].text = modelResponse;
                return newMessages;
            });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: ChatMessage = {
            role: 'model',
            parts: [{ text: 'متاسفم، با یک خطا مواجه شدم. لطفاً دوباره امتحان کنید.' }]
        };
        setMessages(prev => {
            const newMessages = [...prev];
            // Replace the streaming placeholder with the error message
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model') {
                newMessages[newMessages.length - 1] = errorMessage;
                return newMessages;
            }
            return [...newMessages, errorMessage];
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
             <div className="flex flex-col justify-center items-center h-full text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7h-2a5 5 0 0 1-5 5v2z"></path><path d="M16.24 16.24a5 5 0 0 1-7.07 0l-1.42 1.42a7 7 0 0 0 9.9 0l-1.41-1.42zM5 15v-3a7 7 0 0 1 7-7 7 7 0 0 1 7 7v3"></path><path d="M12 5a2 2 0 0 1-2-2V2a2 2 0 0 1 4 0v1a2 2 0 0 1-2 2z"></path></svg>
                <h2 className="text-xl font-semibold text-gray-700">سلام! من فلورا، دستیار کشاورزی شما هستم.</h2>
                <p className="mt-1">امروز چطور می‌توانم کمکتان کنم؟</p>
            </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white rounded-bl-none'
                  : 'bg-gray-200 text-gray-800 rounded-br-none'
              }`}
            >
             {msg.parts[0].text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
             <div className="flex justify-end">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-br-none">
                   <Spinner />
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="درباره کشاورزی بپرسید..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="p-2 rounded-full bg-green-600 text-white disabled:bg-gray-400 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
