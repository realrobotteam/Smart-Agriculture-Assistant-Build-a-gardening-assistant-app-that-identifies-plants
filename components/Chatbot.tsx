import React, { useState, useEffect, useRef } from 'react';
import { createChat } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { ChatMessage } from '../types';
import Spinner from './Spinner';

const Chatbot: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      const session = createChat();
      setChatSession(session);
      setMessages([
        {
          role: 'model',
          parts: [{ text: "سلام! من فلورا، دستیار کشاورزی شما هستم. امروز چطور می‌توانم کمکتان کنم؟" }]
        }
      ]);
    };
    initChat();
  }, []);

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
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
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
        {isLoading && messages[messages.length-1].role === 'user' && (
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