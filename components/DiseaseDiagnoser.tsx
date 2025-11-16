import React, { useState, useRef } from 'react';
import { diagnosePlantDisease } from '../services/geminiService';
import { PlantDiseaseInfo } from '../types';
import Spinner from './Spinner';
import { CameraIcon } from './icons/CameraIcon';
import { AlertTriangleIcon } from './icons/CareIcons';
import { CauseIcon, TreatmentIcon } from './icons/DiagnosisIcons';
import { ShieldIcon } from './icons/ShieldIcon';


const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const DiseaseDiagnoser: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diseaseInfo, setDiseaseInfo] = useState<PlantDiseaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  const DetailCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white rounded-lg p-4 flex items-start gap-4 transition-all hover:bg-gray-50">
        <div className="flex-shrink-0 text-green-600 bg-green-100 rounded-full p-2">{icon}</div>
        <div className="w-full">
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <div className="text-sm text-gray-600 mt-1">{children}</div>
        </div>
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
              <div>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                      {activeTab === 'organic' && treatments.organic.map((t, i) => <li key={`org-${i}`}>{t}</li>)}
                      {activeTab === 'chemical' && treatments.chemical.map((t, i) => <li key={`chem-${i}`}>{t}</li>)}
                  </ul>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
            <div className="p-4 bg-red-50 rounded-lg shadow-sm border border-red-200">
                <h2 className="text-2xl font-bold text-red-800">{diseaseInfo.diseaseName}</h2>
                <p className="mt-2 text-gray-700">{diseaseInfo.description}</p>
            </div>
            
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
    </div>
  );
};

export default DiseaseDiagnoser;
