// FIX: Restructured the component to correctly scope hooks, handlers, and JSX.
// The component function was likely prematurely closed, causing state and handlers
// to be out of scope for the parts of the component that used them.

import React, { useState, useRef, ReactNode } from 'react';
import { analyzePlantVideo } from '../services/geminiService';
import Spinner from './Spinner';
import { VideoIcon } from './icons/VideoIcon';
import { AlertTriangleIcon } from './icons/CareIcons';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
  
const renderMarkdown = (text: string): ReactNode => {
    const lines = text.split('\n');
    const elements: ReactNode[] = [];
    let inList = false;
    let listKey = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('## ')) {
            if (inList) { elements.push(<ul key={`ul-end-${i}`} className="list-disc list-inside space-y-1 text-gray-600 mb-3" />); inList = false; }
            elements.push(<h2 key={i} className="text-lg font-semibold text-gray-800 mt-4 mb-2">{line.substring(3)}</h2>);
        } else if (line.startsWith('# ')) {
            if (inList) { elements.push(<ul key={`ul-end-${i}`} className="list-disc list-inside space-y-1 text-gray-600 mb-3" />); inList = false; }
            elements.push(<h1 key={i} className="text-xl font-bold text-gray-900 mt-4 mb-2">{line.substring(2)}</h1>);
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
            if (!inList) {
                listKey++;
                elements.push(<ul key={`ul-start-${listKey}`} className="list-disc list-inside space-y-1 text-gray-600 mb-3"></ul>);
                inList = true;
            }
            const listUl = elements[elements.length - 1] as React.ReactElement;
            const newChildren = [...(listUl.props.children || []), <li key={i}>{line.substring(2)}</li>];
            elements[elements.length - 1] = React.cloneElement(listUl, {}, newChildren);
        } else {
            if (inList) { inList = false; }
            if (line.trim() !== '') {
                elements.push(<p key={i} className="text-gray-600">{line}</p>);
            }
        }
    }

    return <div className="space-y-3">{elements}</div>;
}


const VideoAnalyzer: React.FC = () => {
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAnalysisResult(null);
      setError(null);
      setVideoPreview(URL.createObjectURL(file));
      
      setIsLoading(true);
      try {
        const base64Video = await fileToBase64(file);
        const result = await analyzePlantVideo(base64Video, file.type);
        setAnalysisResult(result);
      } catch (err: any) {
        setError(err.message || 'یک خطای غیرمنتظره رخ داد.');
        setAnalysisResult(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div
        className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all duration-300"
        onClick={handleUploadClick}
      >
        <input
          type="file"
          accept="video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        <div className="flex flex-col items-center justify-center gap-4 text-gray-500">
            <VideoIcon className="w-12 h-12 text-gray-400"/>
            <p className="font-semibold text-lg">
              {videoPreview ? 'آپلود یک ویدیوی دیگر' : 'برای تحلیل، یک ویدیو آپلود کنید'}
            </p>
            <p className="text-sm">برای انتخاب ویدیو اینجا کلیک کنید. برای بهترین نتیجه، از یک کلیپ کوتاه (کمتر از ۱ دقیقه) استفاده کنید.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {videoPreview && !isLoading && !analysisResult && !error && (
             <div className="w-full md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">ویدیوی شما</h3>
                <video src={videoPreview} controls className="rounded-lg shadow-md w-full object-cover aspect-video" />
            </div>
        )}

        {videoPreview && (isLoading || analysisResult || error) && (
             <div className="w-full">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">ویدیوی شما</h3>
                <video src={videoPreview} controls className="rounded-lg shadow-md w-full object-cover aspect-video" />
            </div>
        )}

        {isLoading && (
            <div className="flex flex-col items-center justify-center p-10 h-full md:col-span-1">
                <Spinner/>
                <p className="mt-4 text-gray-600 text-center">در حال تحلیل ویدیوی شما... این ممکن است کمی طول بکشد.</p>
            </div>
        )}

        {error && (
            <div className="md:col-span-1 bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg flex items-center gap-3">
                <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
                <span>{error}</span>
            </div>
        )}

        {analysisResult && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-2">نتایج تحلیل</h3>
                {renderMarkdown(analysisResult)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoAnalyzer;