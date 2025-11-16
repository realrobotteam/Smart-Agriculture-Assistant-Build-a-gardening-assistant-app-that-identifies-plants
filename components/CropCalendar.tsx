
import React, { useState } from 'react';
import { generateCropCalendar } from '../services/geminiService';
import { CropCalendarResult, CalendarEvent } from '../types';
import Spinner from './Spinner';
import { CalendarIcon } from './icons/CalendarIcon';
import { AlertTriangleIcon, FertilizerIcon, PruningIcon, SunIcon, WaterDropIcon } from './icons/CareIcons';
import { ShieldIcon } from './icons/ShieldIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

const getTaskIcon = (taskType: CalendarEvent['tasks'][0]['taskType']) => {
    switch(taskType) {
        case 'کوددهی': return <FertilizerIcon className="w-5 h-5 text-yellow-600" />;
        case 'آبیاری': return <WaterDropIcon className="w-5 h-5 text-blue-600" />;
        case 'سم‌پاشی': return <ShieldIcon className="w-5 h-5 text-red-600" />;
        case 'هرس': return <PruningIcon className="w-5 h-5 text-purple-600" />;
        case 'بازرسی': return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
        case 'برداشت': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
        default: return <SunIcon className="w-5 h-5 text-gray-600" />;
    }
}

const CropCalendar: React.FC = () => {
    const [crop, setCrop] = useState('');
    const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
    const [calendarResult, setCalendarResult] = useState<CropCalendarResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!crop || !plantingDate) {
            setError("لطفاً نام محصول و تاریخ کاشت را وارد کنید.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setCalendarResult(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const result = await generateCropCalendar(crop, plantingDate, latitude, longitude);
                    if (result.error) {
                        setError(result.error);
                    } else {
                        setCalendarResult(result);
                    }
                } catch (err: any) {
                    setError(err.message || 'یک خطای غیرمنتظره در ایجاد تقویم رخ داد.');
                } finally {
                    setIsLoading(false);
                }
            },
            (geoError) => {
                setError("برای ایجاد تقویم بومی‌شده، به دسترسی به موقعیت مکانی شما نیاز است.");
                setIsLoading(false);
            }
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">تقویم زراعی هوشمند</h1>
                <p className="mt-2 text-gray-600">
                    محصول و تاریخ کاشت را وارد کنید تا یک تقویم شخصی‌سازی شده برای مراقبت از گیاه خود دریافت کنید.
                </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label htmlFor="crop-name" className="block text-sm font-medium text-gray-700 mb-1">نام محصول</label>
                        <input
                            id="crop-name"
                            type="text"
                            value={crop}
                            onChange={(e) => setCrop(e.target.value)}
                            placeholder="مثال: گوجه فرنگی"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            required
                        />
                    </div>
                     <div className="md:col-span-1">
                        <label htmlFor="planting-date" className="block text-sm font-medium text-gray-700 mb-1">تاریخ کاشت</label>
                        <input
                            id="planting-date"
                            type="date"
                            value={plantingDate}
                            onChange={(e) => setPlantingDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full md:col-span-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                        {isLoading ? <Spinner /> : <><CalendarIcon className="w-5 h-5"/> ایجاد تقویم</>}
                    </button>
                </form>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center p-10">
                    <Spinner />
                    <p className="mt-4 text-gray-600">در حال ایجاد تقویم شخصی شما...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg flex items-center gap-3">
                    <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {calendarResult && (
                <div className="space-y-4">
                     <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                        <h2 className="text-xl font-bold text-blue-800">
                           تقویم برای: {calendarResult.cropName} در {calendarResult.locationName}
                        </h2>
                        <p className="mt-1 text-blue-700">کاشته شده در تاریخ: {new Date(calendarResult.plantingDate).toLocaleDateString('fa-IR')}</p>
                    </div>
                    <div className="space-y-4">
                        {calendarResult.schedule.map(event => (
                            <div key={event.week} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-2 mb-3">
                                    <h3 className="text-lg font-bold text-green-700">هفته {event.week} ({event.stage})</h3>
                                    <p className="text-sm font-medium text-gray-500">{event.dateRange}</p>
                                </div>
                                <div className="space-y-2">
                                    {event.tasks.map((task, index) => (
                                        <div key={index} className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50/50">
                                            <div className="flex-shrink-0 mt-1">{getTaskIcon(task.taskType)}</div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800">{task.taskType}</h4>
                                                <p className="text-sm text-gray-600">{task.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CropCalendar;
