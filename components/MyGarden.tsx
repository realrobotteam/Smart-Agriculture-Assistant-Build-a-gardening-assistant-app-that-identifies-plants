import React, { useState, useEffect, useRef } from 'react';
import { SavedPlant } from '../types';
import { LeafIcon } from './icons/LeafIcon';
import { TrashIcon } from './icons/TrashIcon';
import { WaterDropIcon, SunIcon, SoilIcon, FertilizerIcon, PruningIcon, AlertTriangleIcon } from './icons/CareIcons';

const MY_GARDEN_KEY = 'smartAgricultureMyGarden';

const CareInstructionCard: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
    <div className="bg-white rounded-lg p-4 flex items-start gap-4 transition-all hover:bg-gray-50">
        <div className="flex-shrink-0 text-green-600 bg-green-100 rounded-full p-2">{icon}</div>
        <div>
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600">{text}</p>
        </div>
    </div>
);

const MyGarden: React.FC = () => {
    const [myGarden, setMyGarden] = useState<SavedPlant[]>([]);
    const [selectedPlant, setSelectedPlant] = useState<SavedPlant | null>(null);
    const [notes, setNotes] = useState('');
    const notesTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        try {
            const savedGardenJSON = localStorage.getItem(MY_GARDEN_KEY);
            if (savedGardenJSON) {
                setMyGarden(JSON.parse(savedGardenJSON));
            }
        } catch (e) {
            console.error("Failed to load or parse My Garden from local storage:", e);
            localStorage.removeItem(MY_GARDEN_KEY);
        }
    }, []);

    useEffect(() => {
        if (selectedPlant) {
            setNotes(selectedPlant.notes || '');
        }
    }, [selectedPlant]);

    const handleSelectPlant = (plant: SavedPlant) => {
        setSelectedPlant(plant);
    };

    const handleBackToList = () => {
        setSelectedPlant(null);
    };

    const handleDeletePlant = (plantId: string) => {
        if (window.confirm("آیا از حذف این گیاه از باغ خود مطمئن هستید؟")) {
            const updatedGarden = myGarden.filter(p => p.id !== plantId);
            setMyGarden(updatedGarden);
            localStorage.setItem(MY_GARDEN_KEY, JSON.stringify(updatedGarden));
            if (selectedPlant?.id === plantId) {
                setSelectedPlant(null);
            }
        }
    };
    
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNotes = e.target.value;
        setNotes(newNotes);
    
        if (notesTimeoutRef.current) {
            clearTimeout(notesTimeoutRef.current);
        }
    
        notesTimeoutRef.current = window.setTimeout(() => {
            if (!selectedPlant) return;
    
            const updatedGarden = myGarden.map(p =>
                p.id === selectedPlant.id ? { ...p, notes: newNotes } : p
            );
            setMyGarden(updatedGarden);
            localStorage.setItem(MY_GARDEN_KEY, JSON.stringify(updatedGarden));
        }, 1000);
    };

    if (!myGarden.length) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6 text-center text-gray-500">
                <LeafIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-700">باغ شما خالی است</h2>
                <p className="mt-2">
                    برای اضافه کردن گیاهان به باغ خود، از بخش{' '}
                    <span className="font-semibold text-green-600">شناسایی</span>{' '}
                    استفاده کنید.
                </p>
            </div>
        );
    }
    
    if (selectedPlant) {
        const { plantInfo } = selectedPlant;
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <button onClick={handleBackToList} className="text-green-600 font-semibold hover:underline">
                        &larr; بازگشت به باغ
                    </button>
                    <button
                        onClick={() => handleDeletePlant(selectedPlant.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-300 bg-red-100 text-red-700 hover:bg-red-200"
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span>حذف گیاه</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="w-full">
                        <img src={selectedPlant.imageDataUrl} alt={plantInfo.plantName} className="rounded-lg shadow-md w-full object-cover aspect-square" />
                    </div>
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
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-3 bg-gray-50/80 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">دستورالعمل‌های مراقبت</h3>
                        <CareInstructionCard icon={<WaterDropIcon className="w-6 h-6" />} title="آبیاری" text={plantInfo.careInstructions.watering} />
                        <CareInstructionCard icon={<SunIcon className="w-6 h-6" />} title="نور خورشید" text={plantInfo.careInstructions.sunlight} />
                        <CareInstructionCard icon={<SoilIcon className="w-6 h-6" />} title="خاک" text={plantInfo.careInstructions.soil} />
                        <CareInstructionCard icon={<FertilizerIcon className="w-6 h-6" />} title="کود" text={plantInfo.careInstructions.fertilizer} />
                        <CareInstructionCard icon={<PruningIcon className="w-6 h-6" />} title="هرس" text={plantInfo.careInstructions.pruning} />
                    </div>
                     <div className="space-y-3 bg-gray-50/80 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">یادداشت‌های من</h3>
                        <textarea
                            value={notes}
                            onChange={handleNotesChange}
                            placeholder="یادداشت‌های خود را در مورد این گیاه اینجا بنویسید (مانند تاریخ آخرین کوددهی، مشاهده رشد جدید و غیره)..."
                            className="w-full h-48 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                        />
                        <p className="text-xs text-gray-500 text-right">یادداشت‌ها به صورت خودکار ذخیره می‌شوند.</p>
                    </div>
                 </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">باغ من</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {myGarden.map(plant => (
                    <div key={plant.id} className="relative group">
                        <button
                            onClick={() => handleSelectPlant(plant)}
                            className="w-full text-left bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            aria-label={`مشاهده جزئیات برای ${plant.plantInfo.plantName}`}
                        >
                            <img src={plant.imageDataUrl} alt={plant.plantInfo.plantName} className="w-full h-32 object-cover" />
                            <div className="p-3">
                                <p className="font-semibold text-gray-800 truncate group-hover:whitespace-normal">{plant.plantInfo.plantName}</p>
                                <p className="text-xs text-gray-500 italic truncate">{plant.plantInfo.scientificName}</p>
                            </div>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePlant(plant.id); }}
                            className="absolute top-1.5 right-1.5 z-10 p-1 bg-white/70 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label={`حذف ${plant.plantInfo.plantName} از باغ`}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyGarden;
