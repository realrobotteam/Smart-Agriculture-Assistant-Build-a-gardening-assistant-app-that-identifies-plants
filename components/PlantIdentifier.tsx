import React, { useState, useCallback, useRef } from 'react';
import { analyzePlantImage } from '../services/geminiService';
import { PlantInfo } from '../types';
import Spinner from './Spinner';
import { CameraIcon } from './icons/CameraIcon';
import { WaterDropIcon, SunIcon, SoilIcon, FertilizerIcon, PruningIcon, AlertTriangleIcon } from './icons/CareIcons';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const PlantIdentifier: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [plantInfo, setPlantInfo] = useState<PlantInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPlantInfo(null);
      setError(null);
      setImagePreview(URL.createObjectURL(file));
      
      setIsLoading(true);
      try {
        const base64Image = await fileToBase64(file);
        const result = await analyzePlantImage(base64Image, file.type);
        if (result.error || result.plantName.toLowerCase() === 'unknown' || result.plantName === 'ناشناخته') {
            setError(result.error || "گیاه قابل شناسایی نبود. لطفاً یک تصویر واضح‌تر را امتحان کنید.");
            setPlantInfo(null);
        } else {
            setPlantInfo(result);
        }
      } catch (err: any) {
        setError(err.message || 'یک خطای غیرمنتظره رخ داد.');
        setPlantInfo(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const CareInstructionCard: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
    <div className="bg-white rounded-lg p-4 flex items-start gap-4 transition-all hover:bg-gray-50">
        <div className="flex-shrink-0 text-green-600 bg-green-100 rounded-full p-2">{icon}</div>
        <div>
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600">{text}</p>
        </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div
        className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all duration-300"
        onClick={handleUploadClick}
      >
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-4 text-gray-500">
            <CameraIcon className="w-12 h-12 text-gray-400"/>
            <p className="font-semibold text-lg">
              {imagePreview ? 'آپلود یک عکس دیگر' : 'برای شناسایی گیاه، یک عکس آپلود کنید'}
            </p>
            <p className="text-sm">برای انتخاب عکس از دستگاه خود اینجا کلیک کنید</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {imagePreview && (
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">عکس شما</h3>
            <img src={imagePreview} alt="Plant preview" className="rounded-lg shadow-md w-full object-cover aspect-square" />
          </div>
        )}

        {isLoading && (
            <div className="flex flex-col items-center justify-center p-10 h-full md:col-span-1">
                <Spinner/>
                <p className="mt-4 text-gray-600">در حال تحلیل گیاه شما...</p>
            </div>
        )}

        {error && (
            <div className="md:col-span-1 bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg flex items-center gap-3">
                <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
                <span>{error}</span>
            </div>
        )}

        {plantInfo && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">{plantInfo.plantName}</h2>
                <p className="text-md text-gray-500 italic">{plantInfo.scientificName}</p>
                <p className="mt-2 text-gray-700">{plantInfo.description}</p>
                {plantInfo.isPoisonous && (
                    <div className="mt-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 rounded-r-lg flex items-center gap-2 text-sm">
                        <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
                        <strong>هشدار:</strong> این گیاه ممکن است برای حیوانات خانگی یا انسان‌ها سمی باشد.
                    </div>
                )}
            </div>
            
            <div className="space-y-3 bg-gray-50/80 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">دستورالعمل‌های مراقبت</h3>
                <CareInstructionCard icon={<WaterDropIcon className="w-6 h-6" />} title="آبیاری" text={plantInfo.careInstructions.watering} />
                <CareInstructionCard icon={<SunIcon className="w-6 h-6" />} title="نور خورشید" text={plantInfo.careInstructions.sunlight} />
                <CareInstructionCard icon={<SoilIcon className="w-6 h-6" />} title="خاک" text={plantInfo.careInstructions.soil} />
                <CareInstructionCard icon={<FertilizerIcon className="w-6 h-6" />} title="کود" text={plantInfo.careInstructions.fertilizer} />
                <CareInstructionCard icon={<PruningIcon className="w-6 h-6" />} title="هرس" text={plantInfo.careInstructions.pruning} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantIdentifier;