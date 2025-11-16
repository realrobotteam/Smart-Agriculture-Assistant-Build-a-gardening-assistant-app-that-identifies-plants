import React, { useState, useRef } from 'react';
import { analyzePlantVideo } from '../services/geminiService';
import { VideoAnalysisResult, VideoAnalysisSection } from '../types';
import Spinner from './Spinner';
import { VideoIcon } from './icons/VideoIcon';
import { AlertTriangleIcon, DensityIcon, TimelineIcon } from './icons/CareIcons';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getStatusStyles = (status: VideoAnalysisSection['status']) => {
    switch (status) {
        case 'سالم':
            return 'border-green-500 text-green-700 bg-green-50';
        case 'مشکوک':
            return 'border-yellow-500 text-yellow-700 bg-yellow-50';
        case 'بیمار':
            return 'border-red-500 text-red-700 bg-red-50';
        default:
            return 'border-gray-400 text-gray-700 bg-gray-50';
    }
};

const VideoAnalyzer: React.FC = () => {
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
         if (result.error) {
            setError(result.error);
            setAnalysisResult(null);
        } else {
            setAnalysisResult(result);
        }
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

  const handleTimelineClick = (timeInSeconds: number) => {
    if (videoRef.current) {
        videoRef.current.currentTime = timeInSeconds;
        videoRef.current.play();
    }
  }

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
            <p className="text-sm">برای بهترین نتیجه، از یک کلیپ کوتاه (کمتر از ۱ دقیقه) استفاده کنید.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {videoPreview && (
             <div className="w-full md:col-span-1 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">ویدیوی شما</h3>
                <video ref={videoRef} src={videoPreview} controls className="rounded-lg shadow-md w-full object-cover aspect-video" />
            </div>
        )}

        <div className="md:col-span-1 space-y-4">
            {isLoading && (
                <div className="flex flex-col items-center justify-center p-10 h-full">
                    <Spinner/>
                    <p className="mt-4 text-gray-600 text-center">در حال تحلیل ویدیوی شما... این ممکن است کمی طول بکشد.</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg flex items-center gap-3">
                    <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">خلاصه کلی</h3>
                    <p className="text-gray-600">{analysisResult.overallSummary}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <DensityIcon className="w-6 h-6 text-green-600"/>
                        <h3 className="text-xl font-bold text-gray-800">تحلیل تراکم کاشت</h3>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">وضعیت: <span className="font-bold text-green-700">{analysisResult.plantingDensity.status}</span></p>
                    <p className="text-sm text-gray-600 mt-1">{analysisResult.plantingDensity.recommendation}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                     <div className="flex items-center gap-2 mb-3">
                        <TimelineIcon className="w-6 h-6 text-green-600"/>
                        <h3 className="text-xl font-bold text-gray-800">جدول زمانی رویدادها</h3>
                    </div>
                    <div className="space-y-3">
                        {analysisResult.sections.map((section, index) => (
                            <button key={index} onClick={() => handleTimelineClick(section.startTime)} className={`w-full text-right p-3 rounded-lg border-l-4 transition-all hover:bg-gray-100/50 ${getStatusStyles(section.status)}`}>
                                <div className="flex justify-between items-center font-mono text-sm font-semibold">
                                    <span>{formatTime(section.startTime)} - {formatTime(section.endTime)}</span>
                                    <span>{section.status}</span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{section.description}</p>
                                {section.issues.length > 0 && (
                                    <ul className="mt-2 text-xs list-disc list-inside space-y-1">
                                        {section.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                                    </ul>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
              </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default VideoAnalyzer;