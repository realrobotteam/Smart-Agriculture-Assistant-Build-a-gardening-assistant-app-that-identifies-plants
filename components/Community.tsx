import React, { useState, useEffect, useRef } from 'react';
import { CommunityPost, Comment } from '../types';
import { CameraIcon } from './icons/CameraIcon';
import { HeartIcon } from './icons/HeartIcon';
import { MessageSquareIcon } from './icons/MessageSquareIcon';
import Spinner from './Spinner';

const COMMUNITY_POSTS_KEY = 'smartAgricultureCommunityPosts';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const generateAnonymousName = () => {
    const adjectives = ['باغبان', 'کشاورز', 'علاقه‌مند', 'دوستدار', 'پرورش‌دهنده'];
    const nouns = ['گل', 'گیاه', 'طبیعت', 'سبز', 'روستا'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " سال پیش";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ماه پیش";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " روز پیش";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ساعت پیش";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " دقیقه پیش";
    return "همین الان";
}

const getInitialPosts = (): CommunityPost[] => {
    return [
        {
            id: '1',
            authorName: 'باغبان علاقه‌مند',
            text: 'سلام به همگی! من به تازگی یک گیاه برگ انجیری خریدم. کسی نکته‌ای برای مراقبت ازش داره؟',
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
            likes: 5,
            comments: [
                { id: 'c1', authorName: 'دوستدار طبیعت', text: 'حتما نور غیر مستقیم خوب بهش برسون و هفته‌ای یکبار آبیاری کن!', createdAt: new Date(Date.now() - 3600000 * 1).toISOString() }
            ]
        },
        {
            id: '2',
            authorName: 'کشاورز سبز',
            text: 'این گوجه‌فرنگی‌ها رو ببینید! محصول امسالم عالی شده.',
            imageDataUrl: 'https://images.unsplash.com/photo-1598512752271-33f913a5af13?q=80&w=2070&auto=format&fit=crop',
            createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
            likes: 12,
            comments: []
        }
    ];
};

const Community: React.FC = () => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [view, setView] = useState<'feed' | 'create' | 'detail'>('feed');
    const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
    
    // Create Post State
    const [postText, setPostText] = useState('');
    const [postImage, setPostImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Detail View State
    const [newComment, setNewComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);

    useEffect(() => {
        try {
            const savedPostsJSON = localStorage.getItem(COMMUNITY_POSTS_KEY);
            if (savedPostsJSON) {
                setPosts(JSON.parse(savedPostsJSON));
            } else {
                const initialPosts = getInitialPosts();
                setPosts(initialPosts);
                localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(initialPosts));
            }
        } catch (error) {
            console.error("Failed to load or parse community posts:", error);
            setPosts(getInitialPosts());
        }
    }, []);

    const persistPosts = (updatedPosts: CommunityPost[]) => {
        setPosts(updatedPosts);
        localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(updatedPosts));
    };
    
    const handleLike = (postId: string) => {
        const updatedPosts = posts.map(p => 
            p.id === postId ? { ...p, likes: p.likes + 1 } : p
        );
        persistPosts(updatedPosts);
    };
    
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            setPostImage(base64);
        }
    };

    const handleSubmitPost = (e: React.FormEvent) => {
        e.preventDefault();
        if (!postText.trim()) return;

        setIsSubmitting(true);
        const newPost: CommunityPost = {
            id: Date.now().toString(),
            authorName: generateAnonymousName(),
            text: postText,
            imageDataUrl: postImage || undefined,
            createdAt: new Date().toISOString(),
            likes: 0,
            comments: []
        };
        
        // Simulate network delay
        setTimeout(() => {
            persistPosts([newPost, ...posts]);
            setPostText('');
            setPostImage(null);
            setIsSubmitting(false);
            setView('feed');
        }, 500);
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !selectedPost) return;

        setIsCommenting(true);
        const comment: Comment = {
            id: Date.now().toString(),
            authorName: generateAnonymousName(),
            text: newComment,
            createdAt: new Date().toISOString()
        };
        
        // Simulate network delay
        setTimeout(() => {
            const updatedPosts = posts.map(p => 
                p.id === selectedPost.id ? { ...p, comments: [...p.comments, comment] } : p
            );
            persistPosts(updatedPosts);
            setSelectedPost(prev => prev ? { ...prev, comments: [...prev.comments, comment] } : null);
            setNewComment('');
            setIsCommenting(false);
        }, 500);
    };

    const renderFeedView = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">انجمن</h1>
                <button 
                    onClick={() => setView('create')}
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                >
                    ایجاد پست جدید
                </button>
            </div>
            <div className="space-y-4">
                {posts.map(post => (
                    <div key={post.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer transition-shadow hover:shadow-md" onClick={() => { setSelectedPost(post); setView('detail'); }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-green-700">{post.authorName.charAt(0)}</div>
                            <div>
                                <p className="font-semibold text-gray-800">{post.authorName}</p>
                                <p className="text-xs text-gray-500">{timeSince(new Date(post.createdAt))}</p>
                            </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{post.text}</p>
                        {post.imageDataUrl && <img src={post.imageDataUrl} alt="پست انجمن" className="mt-3 rounded-lg max-h-80 w-auto" />}
                        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100">
                            <button onClick={(e) => { e.stopPropagation(); handleLike(post.id); }} className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors">
                                <HeartIcon className="w-5 h-5"/>
                                <span className="text-sm font-medium">{post.likes}</span>
                            </button>
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <MessageSquareIcon className="w-5 h-5"/>
                                <span className="text-sm font-medium">{post.comments.length}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCreateView = () => (
        <div>
            <button onClick={() => setView('feed')} className="text-green-600 font-semibold hover:underline mb-4">
                &larr; بازگشت به انجمن
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">ایجاد پست جدید</h1>
            <form onSubmit={handleSubmitPost} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <textarea 
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="سوال خود را بپرسید یا تجربه خود را به اشتراک بگذارید..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                    required
                />
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                        <CameraIcon className="w-5 h-5 text-gray-500"/>
                        <span>{postImage ? 'تغییر عکس' : 'افزودن عکس'}</span>
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden"/>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-400">
                        {isSubmitting ? <Spinner /> : 'ارسال'}
                    </button>
                </div>
                {postImage && <img src={postImage} alt="پیش‌نمایش پست" className="mt-4 rounded-lg max-h-60 w-auto"/>}
            </form>
        </div>
    );
    
    const renderDetailView = () => (
        selectedPost && <div>
             <button onClick={() => setView('feed')} className="text-green-600 font-semibold hover:underline mb-4">
                &larr; بازگشت به انجمن
            </button>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-green-700">{selectedPost.authorName.charAt(0)}</div>
                    <div>
                        <p className="font-semibold text-gray-800">{selectedPost.authorName}</p>
                        <p className="text-xs text-gray-500">{timeSince(new Date(selectedPost.createdAt))}</p>
                    </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedPost.text}</p>
                {selectedPost.imageDataUrl && <img src={selectedPost.imageDataUrl} alt="پست انجمن" className="mt-3 rounded-lg max-h-96 w-auto" />}
                <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100">
                    <button onClick={(e) => { e.stopPropagation(); handleLike(selectedPost.id); }} className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors">
                        <HeartIcon className="w-5 h-5"/>
                        <span className="text-sm font-medium">{selectedPost.likes}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <MessageSquareIcon className="w-5 h-5"/>
                        <span className="text-sm font-medium">{selectedPost.comments.length}</span>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">نظرات</h2>
                <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                    <input 
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="نظر خود را بنویسید..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                    />
                    <button type="submit" disabled={isCommenting} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full shadow-sm hover:bg-green-700 transition-colors disabled:bg-gray-400">
                       {isCommenting ? '...' : 'ارسال'}
                    </button>
                </form>
                <div className="space-y-3">
                    {selectedPost.comments.map(comment => (
                        <div key={comment.id} className="bg-gray-100 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-gray-700">{comment.authorName}</p>
                                <p className="text-xs text-gray-500">&middot; {timeSince(new Date(comment.createdAt))}</p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{comment.text}</p>
                        </div>
                    ))}
                    {selectedPost.comments.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">هنوز نظری ثبت نشده است. اولین نفر باشید!</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            {view === 'feed' && renderFeedView()}
            {view === 'create' && renderCreateView()}
            {view === 'detail' && renderDetailView()}
        </div>
    );
};

export default Community;
