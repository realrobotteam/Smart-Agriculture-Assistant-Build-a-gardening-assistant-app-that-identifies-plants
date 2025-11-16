import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChat, generateChatTitle } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { ChatMessage, SavedChat } from '../types';
import Spinner from './Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { TrashIcon } from './icons/TrashIcon';

const CHAT_SESSIONS_KEY = 'smartAgricultureChatSessions';

const Chatbot: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved chats from local storage on initial render
  useEffect(() => {
    try {
      const savedHistoryJSON = localStorage.getItem(CHAT_SESSIONS_KEY);
      if (savedHistoryJSON) {
        const history: SavedChat[] = JSON.parse(savedHistoryJSON);
        setSavedChats(history);
        if (history.length > 0) {
          setActiveChatId(history[0].id); // Load the most recent chat
        } else {
          handleNewChat(); // Start a new chat if history is empty
        }
      } else {
        handleNewChat(); // Start a new chat if no history exists
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      localStorage.removeItem(CHAT_SESSIONS_KEY);
      handleNewChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save chats to local storage whenever they change
  useEffect(() => {
    if (savedChats.length > 0) {
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(savedChats));
    } else {
      localStorage.removeItem(CHAT_SESSIONS_KEY);
    }
  }, [savedChats]);
  
  // Effect to handle switching between chats
  useEffect(() => {
    if (activeChatId) {
      const activeChat = savedChats.find(c => c.id === activeChatId);
      if (activeChat) {
        setMessages(activeChat.history);
        setChatSession(createChat(activeChat.history));
      }
    } else {
        setMessages([]);
        setChatSession(createChat());
    }
  }, [activeChatId, savedChats]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleNewChat = useCallback(() => {
    const newChat: SavedChat = {
      id: Date.now().toString(),
      title: 'چت جدید',
      history: [],
      createdAt: new Date().toISOString(),
    };
    setSavedChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setIsHistoryOpen(false);
  }, []);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsHistoryOpen(false);
  };

  const handleDeleteChat = (chatIdToDelete: string) => {
    const updatedChats = savedChats.filter(c => c.id !== chatIdToDelete);
    setSavedChats(updatedChats);

    // If the deleted chat was active, select another one or create a new one
    if (activeChatId === chatIdToDelete) {
      if (updatedChats.length > 0) {
        setActiveChatId(updatedChats[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !chatSession || !activeChatId) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: userInput }] };
    const currentInput = userInput;
    setUserInput('');
    setIsLoading(true);

    const isFirstMessage = messages.length === 0;

    // Update state immediately for better UX
    setMessages(prev => [...prev, userMessage]);
    setSavedChats(prev => prev.map(chat =>
        chat.id === activeChatId
        ? { ...chat, history: [...chat.history, userMessage] }
        : chat
    ));

    try {
        if (isFirstMessage) {
          // Don't wait for title generation to show response
          generateChatTitle(currentInput).then(newTitle => {
            setSavedChats(prev => prev.map(chat =>
              chat.id === activeChatId ? { ...chat, title: newTitle } : chat
            ));
          });
        }
        
        const result = await chatSession.sendMessageStream({ message: currentInput });

        let modelResponse = '';
        const modelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }]};
        
        setMessages(prev => [...prev, modelMessage]);
        
        for await (const chunk of result) {
            modelResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].parts[0].text = modelResponse;
                return newMessages;
            });
        }
        
        // Final update to saved chats after stream is complete
        const finalModelMessage = { role: 'model', parts: [{ text: modelResponse }] } as ChatMessage;
        setSavedChats(prev => prev.map(chat =>
            chat.id === activeChatId
            ? { ...chat, history: [...chat.history, finalModelMessage] }
            : chat
        ));

    } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: ChatMessage = {
            role: 'model',
            parts: [{ text: 'متاسفم، با یک خطا مواجه شدم. لطفاً دوباره امتحان کنید.' }]
        };
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
        setSavedChats(prev => prev.map(chat =>
          chat.id === activeChatId
          ? { ...chat, history: [...chat.history, errorMessage] }
          : chat
        ));
    } finally {
        setIsLoading(false);
    }
  };

  const HistorySidebar = () => (
    <div className="flex flex-col h-full bg-gray-100 border-l border-gray-200">
        <div className="p-3 flex justify-between items-center border-b border-gray-200">
            <h2 className="font-bold text-lg text-gray-800">تاریخچه چت</h2>
            <button
                onClick={handleNewChat}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-300 bg-green-600 text-white hover:bg-green-700"
            >
                <PlusIcon className="w-4 h-4" />
                <span>چت جدید</span>
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {savedChats.map(chat => (
                <div key={chat.id} className="relative group">
                    <button
                        onClick={() => handleSelectChat(chat.id)}
                        className={`w-full text-right p-2.5 rounded-lg transition-colors duration-200 truncate ${
                            activeChatId === chat.id 
                                ? 'bg-green-200 text-green-800 font-semibold' 
                                : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {chat.title}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`حذف چت ${chat.title}`}
                    >
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-150px)] max-w-4xl mx-auto border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Mobile History Panel (Toggleable) */}
        {isHistoryOpen && (
            <div className="absolute inset-0 z-20 bg-gray-800/50 lg:hidden" onClick={() => setIsHistoryOpen(false)}>
                <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-sm bg-white" onClick={e => e.stopPropagation()}>
                    <HistorySidebar />
                </div>
            </div>
        )}

        {/* Desktop History Panel */}
        <div className="hidden lg:block w-1/3 max-w-xs">
            <HistorySidebar />
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 bg-white">
            <div className="p-3 border-b border-gray-200 flex items-center lg:hidden">
                <button 
                    onClick={() => setIsHistoryOpen(true)}
                    className="flex items-center gap-2 text-gray-600 font-medium"
                >
                    <HistoryIcon className="w-5 h-5"/>
                    <span>تاریخچه</span>
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col justify-center items-center h-full text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7h-2a5 5 0 0 1-5 5v2z"></path><path d="M16.24 16.24a5 5 0 0 1-7.07 0l-1.42 1.42a7 7 0 0 0 9.9 0l-1.41-1.42zM5 15v-3a7 7 0 0 1 7-7 7 7 0 0 1 7 7v3"></path><path d="M12 5a2 2 0 0 1-2-2V2a2 2 0 0 1 4 0v1a2 2 0 0 1-2 2z"></path></svg>
                        <h2 className="text-xl font-semibold text-gray-700">سلام! من فلورا، دستیار کشاورزی شما هستم.</h2>
                        <p className="mt-1">امروز چطور می‌توانم کمکتان کنم؟</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl whitespace-pre-wrap ${
                        msg.role === 'user'
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                    >
                    {msg.parts[0].text}
                    </div>
                </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
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
                    <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default Chatbot;
