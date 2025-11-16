import React, { useState, useRef, useEffect } from 'react';
import { diagnosePlantDisease } from '../services/geminiService';
import { PlantDiseaseInfo, DiseaseHistoryEntry } from '../types';
import Spinner from './Spinner';
import { CameraIcon } from './icons/CameraIcon';
import { AlertTriangleIcon } from './icons/CareIcons';
import { CauseIcon, TreatmentIcon } from './icons/DiagnosisIcons';
import { ShieldIcon } from './icons/ShieldIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrashIcon } from './icons/TrashIcon';


const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const DIAGNOSIS_HISTORY_KEY = 'smartAgricultureDiagnosisHistory';

const getSeverityStyles = (severity: string) => {
    const severityNormalized = severity?.toLowerCase() || '';
    if (severityNormalized.includes('کم')) {
      return { label: 'کم', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' };
    }
    if (severityNormalized.includes('متوسط')) {
      return { label: 'متوسط', bgColor: 'bg-orange-50', textColor: 'text-orange-800', borderColor: 'border-orange-200' };
    }
    if (severityNormalized.includes('زیاد')) {
      return { label: 'زیاد', bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200' };
    }
    if (severityNormalized.includes('بحرانی')) {
      return { label: 'بحرانی', bgColor: 'bg-red-100', textColor: 'text-red-900', borderColor: 'border-red-300' };
    }
    return { label: severity || 'نامشخص', bgColor: 'bg-gray-100', textColor: 'text-gray-800', borderColor: 'border-gray-200' };
};

const DiseaseDiagnoser: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diseaseInfo, setDiseaseInfo] = useState<PlantDiseaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DiseaseHistoryEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedHistoryJSON = localStorage.getItem(DIAGNOSIS_HISTORY_KEY);
      if (savedHistoryJSON) {
        setHistory(JSON.parse(savedHistoryJSON));
      }
    } catch (error) {
      console.error("Failed to load or parse diagnosis history:", error);
      localStorage.removeItem(DIAGNOSIS_HISTORY_KEY);
    }
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDiseaseInfo(null);
      setError(null);
      setImagePreview(URL.createObjectURL(file));
      
      setIsLoading(true);
      try {
        const base64Image = await fileToBase64(file);
        const result = await diagnosePlantDisease(base64Image, file.type);
        if (result.error || result.diseaseName.toLowerCase() === 'unknown' || result.diseaseName === 'ناشناخته') {
            setError(result.error || "بیماری قابل شناسایی نبود. لطفاً یک تصویر واضح‌تر از ناحیه آسیب‌دیده امتحان کنید.");
            setDiseaseInfo(null);
        } else {
            setDiseaseInfo(result);
            const newEntry: DiseaseHistoryEntry = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              imageDataUrl: `data:${file.type};base64,${base64Image}`,
              diagnosis: result
            };
            const updatedHistory = [newEntry, ...history];
            setHistory(updatedHistory);
            localStorage.setItem(DIAGNOSIS_HISTORY_KEY, JSON.stringify(updatedHistory));
        }
      } catch (err: any) {
        setError(err.message || 'یک خطای غیرمنتظره رخ داد.');
        setDiseaseInfo(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleHistoryClick = (entry: DiseaseHistoryEntry) => {
    setImagePreview(entry.imageDataUrl);
    setDiseaseInfo(entry.diagnosis);
    setError(null);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteHistoryEntry = (idToDelete: string) => {
    if (window.confirm("آیا از حذف این مورد از تاریخچه مطمئن هستید؟")) {
        const updatedHistory = history.filter(entry => entry.id !== idToDelete);
        setHistory(updatedHistory);
        if (updatedHistory.length > 0) {
            localStorage.setItem(DIAGNOSIS_HISTORY_KEY, JSON.stringify(updatedHistory));
        } else {
            localStorage.removeItem(DIAGNOSIS_HISTORY_KEY);
        }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("آیا از پاک کردن تمام تاریخچه تشخیص‌ها مطمئن هستید؟ این عمل قابل بازگشت نیست.")) {
      setHistory([]);
      localStorage.removeItem(DIAGNOSIS_HISTORY_KEY);
    }
  };
  
  const DetailCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white rounded-lg p-4 flex items-start gap-4 transition-all hover:bg-gray-50">
        <div className="flex-shrink-0 text-green-600 bg-green-100 rounded-full p-2">{icon}</div>
        <div className="w-full">
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <div className="text-sm text-gray-600 mt-1">{children}</div>
        </div>
    </div>
  );

  const TreatmentAction: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-green-50/50">
      <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );

  const TreatmentTabs: React.FC<{ treatments: PlantDiseaseInfo['treatment'] }> = ({ treatments }) => {
      const [activeTab, setActiveTab] = useState<'organic' | 'chemical'>('organic');

      const getButtonClass = (tabName: 'organic' | 'chemical') => 
          `px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tabName 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`;

      return (
          <div>
              <div className="flex items-center gap-2 mb-2">
                  <button className={getButtonClass('organic')} onClick={() => setActiveTab('organic')}>ارگانیک</button>
                  <button className={getButtonClass('chemical')} onClick={() => setActiveTab('chemical')}>شیمیایی</button>
              </div>
              <div className="space-y-2">
                {activeTab === 'organic' && (treatments.organic.length > 0 
                    ? treatments.organic.map((t, i) => <TreatmentAction key={`org-${i}`} text={t} />) 
                    : <p className="text-sm text-gray-500 px-2">روش درمانی ارگانیک یافت نشد.</p>
                )}
                {activeTab === 'chemical' && (treatments.chemical.length > 0 
                    ? treatments.chemical.map((t, i) => <TreatmentAction key={`chem-${i}`} text={t} />)
                    : <p className="text-sm text-gray-500 px-2">روش درمانی شیمیایی یافت نشد.</p>
                )}
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div
        className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all duration-300"
        onClick={handleUploadClick}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-4 text-gray-500">
            <CameraIcon className="w-12 h-12 text-gray-400"/>
            <p className="font-semibold text-lg">
              {imagePreview ? 'آپلود یک عکس دیگر' : 'برای تشخیص بیماری، یک عکس آپلود کنید'}
            </p>
            <p className="text-sm">از ناحیه آسیب دیده گیاه یک عکس واضح بگیرید</p>
        </div>
      </div>

      <div ref={resultsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {imagePreview && (
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">عکس شما</h3>
            <img src={imagePreview} alt="Plant preview for disease" className="rounded-lg shadow-md w-full object-cover aspect-square" />
          </div>
        )}

        {isLoading && (
            <div className="flex flex-col items-center justify-center p-10 h-full md:col-span-1">
                <Spinner/>
                <p className="mt-4 text-gray-600">در حال تشخیص بیماری...</p>
            </div>
        )}

        {error && (
            <div className="md:col-span-1 bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg flex items-center gap-3">
                <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
                <span>{error}</span>
            </div>
        )}

        {diseaseInfo && (
          <div className="space-y-4">
            {(() => {
              const { label, bgColor, textColor, borderColor } = getSeverityStyles(diseaseInfo.severity);
              return (
                <div className={`p-4 rounded-lg shadow-sm border ${borderColor} ${bgColor}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className={`text-2xl font-bold ${textColor}`}>{diseaseInfo.diseaseName}</h2>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${borderColor}`}>
                      سطح شدت: {label}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700">{diseaseInfo.description}</p>
                </div>
              );
            })()}
            
            <div className="space-y-3 bg-gray-50/80 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">جزئیات تشخیص</h3>
                <DetailCard icon={<CauseIcon className="w-6 h-6" />} title="دلایل احتمالی">
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        {diseaseInfo.possibleCauses.map((cause, i) => <li key={i}>{cause}</li>)}
                    </ul>
                </DetailCard>
                <DetailCard icon={<TreatmentIcon className="w-6 h-6" />} title="روش‌های درمان">
                   <TreatmentTabs treatments={diseaseInfo.treatment} />
                </DetailCard>
                <DetailCard icon={<ShieldIcon className="w-6 h-6" />} title="پیشگیری">
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        {diseaseInfo.prevention.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                </DetailCard>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">تاریخچه تشخیص‌ها</h2>
            <button
              onClick={handleClearHistory}
              className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors px-3 py-1 rounded-md hover:bg-red-50"
              aria-label="پاک کردن تاریخچه تشخیص بیماری"
            >
              پاک کردن تاریخچه
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {history.map(entry => (
               <div
                key={entry.id}
                className="relative bg-white rounded-lg shadow-md overflow-hidden group transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
              >
                <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteHistoryEntry(entry.id); }}
                    className="absolute top-1.5 right-1.5 z-10 p-1 bg-white/70 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                    aria-label={`حذف تشخیص برای ${entry.diagnosis.diseaseName}`}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleHistoryClick(entry)}
                    className="w-full text-right focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-lg"
                    aria-label={`مشاهده جزئیات برای ${entry.diagnosis.diseaseName}`}
                >
                  <img src={entry.imageDataUrl} alt={`عکس تشخیص برای ${entry.diagnosis.diseaseName}`} className="w-full h-32 object-cover" />
                  <div className="p-3">
                    <p className="font-semibold text-gray-800 truncate group-hover:whitespace-normal">{entry.diagnosis.diseaseName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(entry.date).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseDiagnoser;