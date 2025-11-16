import React, { useState } from 'react';
import { getWeatherBasedAlerts } from '../services/geminiService';
import { WeatherAlertsInfo } from '../types';
import Spinner from './Spinner';
import { AlertsIcon } from './icons/AlertsIcon';
import { AlertTriangleIcon } from './icons/CareIcons';

const getRiskStyles = (riskLevel: 'کم' | 'متوسط' | 'زیاد') => {
    switch (riskLevel) {
        case 'کم':
            return 'border-green-500 bg-green-50';
        case 'متوسط':
            return 'border-yellow-500 bg-yellow-50';
        case 'زیاد':
            return 'border-red-500 bg-red-50';
        default:
            return 'border-gray-300 bg-gray-50';
    }
};

const SmartAlerts: React.FC = () => {
    const [alertsInfo, setAlertsInfo] = useState<WeatherAlertsInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchAlerts = () => {
        setIsLoading(true);
        setError(null);
        setAlertsInfo(null);

        if (!navigator.geolocation) {
            setError("مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند.");
            setIsLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const result = await getWeatherBasedAlerts(latitude, longitude);
                    if (result.error) {
                        setError(result.error);
                    } else {
                        setAlertsInfo(result);
                    }
                } catch (err: any) {
                    setError(err.message || 'یک خطای غیرمنتظره در دریافت هشدارها رخ داد.');
                } finally {
                    setIsLoading(false);
                }
            },
            (geoError) => {
                let errorMessage = 'خطا در دریافت موقعیت مکانی: ';
                switch (geoError.code) {
                    case geoError.PERMISSION_DENIED:
                        errorMessage += 'شما اجازه دسترسی به موقعیت مکانی را ندادید.';
                        break;
                    case geoError.POSITION_UNAVAILABLE:
                        errorMessage += 'اطلاعات موقعیت مکانی در دسترس نیست.';
                        break;
                    case geoError.TIMEOUT:
                        errorMessage += 'زمان درخواست برای دریافت موقعیت مکانی به پایان رسید.';
                        break;
                    default:
                        errorMessage += 'یک خطای ناشناخته رخ داد.';
                        break;
                }
                setError(errorMessage);
                setIsLoading(false);
            }
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">هشدارهای هوشمند</h1>
                <p className="mt-2 text-gray-600">
                    بر اساس موقعیت مکانی و پیش‌بینی آب‌وهوا، هشدارهای پیشگیرانه درباره بیماری‌های احتمالی گیاهان دریافت کنید.
                </p>
            </div>

            {!alertsInfo && !isLoading && (
                 <div className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
                    <button
                        onClick={handleFetchAlerts}
                        disabled={isLoading}
                        className="flex flex-col items-center justify-center gap-4 text-gray-500 w-full hover:text-green-600 transition-colors"
                    >
                        <AlertsIcon className="w-12 h-12 text-gray-400"/>
                        <span className="font-semibold text-lg">
                            دریافت هشدارها بر اساس موقعیت مکانی
                        </span>
                        <span className="text-sm">برای ادامه، روی اینجا کلیک کنید و به برنامه اجازه دسترسی به موقعیت مکانی خود را بدهید.</span>
                    </button>
                </div>
            )}

            {isLoading && (
                <div className="flex flex-col items-center justify-center p-10">
                    <Spinner />
                    <p className="mt-4 text-gray-600">در حال دریافت موقعیت و تحلیل آب‌وهوا...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg flex items-center gap-3">
                    <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            
            {alertsInfo && (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                        <h2 className="text-xl font-bold text-blue-800">
                           تحلیل برای: <span className="font-mono">{alertsInfo.locationName}</span>
                        </h2>
                        <p className="mt-1 text-blue-700">{alertsInfo.overallSummary}</p>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 pt-4">هشدارهای فعال</h3>
                    {alertsInfo.alerts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {alertsInfo.alerts.map((alert, index) => (
                                <div key={index} className={`p-4 rounded-lg border-l-4 ${getRiskStyles(alert.riskLevel)}`}>
                                    <h4 className="font-bold text-lg text-gray-800">{alert.diseaseName}</h4>
                                    <p className="text-sm font-semibold text-gray-600 mb-2">
                                        سطح خطر: {alert.riskLevel}
                                    </p>
                                    <p className="text-sm text-gray-700"><strong className="font-semibold">دلیل:</strong> {alert.reason}</p>
                                    <p className="text-sm text-gray-700 mt-2"><strong className="font-semibold">اقدام پیشنهادی:</strong> {alert.preventativeAction}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-6">
                            خبر خوب! در حال حاضر هیچ خطر آب‌وهوایی قابل توجهی برای بیماری‌های رایج گیاهان در منطقه شما پیش‌بینی نمی‌شود.
                        </p>
                    )}
                     <div className="text-center pt-4">
                        <button 
                            onClick={handleFetchAlerts}
                            disabled={isLoading}
                            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                        >
                            بررسی مجدد
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SmartAlerts;
