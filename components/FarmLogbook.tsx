
import React, { useState, useEffect, useRef } from 'react';
import { LogbookEntry, SavedPlant, DiseaseHistoryEntry, ManualLog, FollowUp } from '../types';
import { evaluateTreatmentEffectiveness } from '../services/geminiService';
import Spinner from './Spinner';
import { LogbookIcon } from './icons/LogbookIcon';
import { TrashIcon } from './icons/TrashIcon';
import { WaterDropIcon, SunIcon, SoilIcon, FertilizerIcon, PruningIcon, AlertTriangleIcon } from './icons/CareIcons';
import { CameraIcon } from './icons/CameraIcon';
import { PlusIcon } from './icons/PlusIcon';

const FARM_LOGBOOK_KEY = 'smartAgricultureFarmLogbook';
const MY_GARDEN_KEY_OLD = 'smartAgricultureMyGarden';
const DIAGNOSIS_HISTORY_KEY_OLD = 'smartAgricultureDiagnosisHistory';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const CareInstructionCard: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
    <div className="bg-white rounded-lg p-4 flex items-start gap-4 transition-all hover:bg-gray-50">
        <div className="flex-shrink-0 text-green-600 bg-green-100 rounded-full p-2">{icon}</div>
        <div>
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600">{text}</p>
        </div>
    </div>
);

const FarmLogbook: React.FC = () => {
    const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<LogbookEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // For manual logs
    const [showLogModal, setShowLogModal] = useState(false);
    const [logActionType, setLogActionType] = useState<ManualLog['actionType']>('آبیاری');
    const [logNotes, setLogNotes] = useState('');

    // For follow-ups
    const [isAssessing, setIsAssessing] = useState(false);
    const [assessmentError, setAssessmentError] = useState<string | null>(null);
    const followUpFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const logbookJSON = localStorage.getItem(FARM_LOGBOOK_KEY);
        if (logbookJSON) {
            setLogbook(JSON.parse(logbookJSON));
            setIsLoading(false);
            return;
        }

        // --- One-time Migration ---
        let migratedEntries: LogbookEntry[] = [];
        
        const gardenJSON = localStorage.getItem(MY_GARDEN_KEY_OLD);
        if (gardenJSON) {
            try {
                const gardenPlants: Omit<SavedPlant, 'type'|'date'>[] = JSON.parse(gardenJSON);
                const migratedPlants: SavedPlant[] = gardenPlants.map(p => ({ ...p, type: 'identification', date: p.id }));
                migratedEntries.push(...migratedPlants);
            } catch (e) { console.error("Error migrating My Garden:", e); }
        }

        const diagnosisJSON = localStorage.getItem(DIAGNOSIS_HISTORY_KEY_OLD);
        if (diagnosisJSON) {
            try {
                const diagnoses: Omit<DiseaseHistoryEntry, 'type'>[] = JSON.parse(diagnosisJSON);
                const migratedDiagnoses: DiseaseHistoryEntry[] = diagnoses.map(d => ({ ...d, type: 'diagnosis' }));
                migratedEntries.push(...migratedDiagnoses);
            } catch (e) { console.error("Error migrating Diagnosis History:", e); }
        }

        migratedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setLogbook(migratedEntries);
        if (migratedEntries.length > 0) {
            localStorage.setItem(FARM_LOGBOOK_KEY, JSON.stringify(migratedEntries));
        }

        localStorage.removeItem(MY_GARDEN_KEY_OLD);
        localStorage.removeItem(DIAGNOSIS_HISTORY_KEY_OLD);
        setIsLoading(false);

    }, []);

    const updateLogbook = (updatedLogbook: LogbookEntry[]) => {
        setLogbook(updatedLogbook);
        localStorage.setItem(FARM_LOGBOOK_KEY, JSON.stringify(updatedLogbook));
    };

    const handleDeleteEntry = (entryId: string) => {
        if (window.confirm("آیا از حذف این مورد از دفتر مزرعه خود مطمئن هستید؟")) {
            const updated = logbook.filter(p => p.id !== entryId);
            updateLogbook(updated);
            if (selectedEntry?.id === entryId) {
                setSelectedEntry(null);
            }
        }
    };

    const handleAddManualLog = () => {
        if (!logNotes.trim() || !selectedEntry) return;
        const newLog: ManualLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            actionType: logActionType,
            notes: logNotes,
        };
        const updatedEntry = { ...selectedEntry, manualLogs: [...(selectedEntry.manualLogs || []), newLog] };
        
        const updatedLogbook = logbook.map(e => e.id === selectedEntry.id ? updatedEntry : e);
        updateLogbook(updatedLogbook);
        setSelectedEntry(updatedEntry as LogbookEntry);

        setShowLogModal(false);
        setLogNotes('');
    };

    const handleFollowUpFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedEntry || selectedEntry.type !== 'diagnosis') return;

        setIsAssessing(true);
        setAssessmentError(null);
        try {
            const base64ImageAfter = await fileToBase64(file);
            const assessmentText = await evaluateTreatmentEffectiveness(
                selectedEntry.imageDataUrl,
                'image/jpeg', // Assuming jpeg, could be improved
                base64ImageAfter,
                file.type,
                selectedEntry.diagnosis.diagnoses[0].issueName
            );

            const newFollowUp: FollowUp = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                imageDataUrl: base64ImageAfter,
                assessment: assessmentText,
            };

            const updatedEntry = { ...selectedEntry, followUps: [...(selectedEntry.followUps || []), newFollowUp] };
            const updatedLogbook = logbook.map(e => e.id === selectedEntry.id ? updatedEntry : e);
            updateLogbook(updatedLogbook);
            setSelectedEntry(updatedEntry as DiseaseHistoryEntry);

        } catch (err: any) {
            setAssessmentError(err.message || "خطا در ارزیابی");
        } finally {
            setIsAssessing(false);
        }
    };

    if (isLoading) {
        return <div className="p-10"><Spinner /></div>;
    }
    
    if (!logbook.length) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6 text-center text-gray-500">
                <LogbookIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-700">دفتر مزرعه شما خالی است</h2>
                <p className="mt-2">
                    از بخش‌های <span className="font-semibold text-green-600">شناسایی</span> و <span className="font-semibold text-green-600">تشخیص بیماری</span> برای اضافه کردن موارد استفاده کنید.
                </p>
            </div>
        );
    }
    
    if (selectedEntry) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <button onClick={() => setSelectedEntry(null)} className="text-green-600 font-semibold hover:underline">
                        &larr; بازگشت به دفتر مزرعه
                    </button>
                    <button
                        onClick={() => handleDeleteEntry(selectedEntry.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-300 bg-red-100 text-red-700 hover:bg-red-200"
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span>حذف</span>
                    </button>
                </div>
                 {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div>
                        <img src={selectedEntry.imageDataUrl} alt="Logbook entry" className="rounded-lg shadow-md w-full object-cover aspect-square" />
                    </div>
                     <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        {selectedEntry.type === 'identification' && (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800">{selectedEntry.plantInfo.plantName}</h2>
                                <p className="text-md text-gray-500 italic">{selectedEntry.plantInfo.scientificName}</p>
                                {selectedEntry.plantInfo.variety && (
                                    <p className="text-md font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-block mt-2">{selectedEntry.plantInfo.variety}</p>
                                )}
                                <p className="mt-2 text-gray-700">{selectedEntry.plantInfo.description}</p>
                                {selectedEntry.plantInfo.isPoisonous && (
                                    <div className="mt-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 rounded-r-lg flex items-center gap-2 text-sm">
                                        <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
                                        <strong>هشدار:</strong> این گیاه ممکن است سمی باشد.
                                    </div>
                                )}
                            </>
                        )}
                        {selectedEntry.type === 'diagnosis' && (
                             <>
                                <h2 className="text-2xl font-bold text-gray-800">{selectedEntry.diagnosis.diagnoses[0].issueName}</h2>
                                <p className="text-md text-gray-500">{selectedEntry.diagnosis.diagnoses[0].issueType}</p>
                                <div className="mt-2 p-3 bg-green-50 border-green-400 border rounded-md">
                                     <h4 className="font-semibold text-green-800">خلاصه وضعیت سلامت</h4>
                                    <p className="text-sm text-green-700">{selectedEntry.diagnosis.overallHealthSummary}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Timeline and Details */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">تاریخچه و اقدامات</h3>
                        <button onClick={() => setShowLogModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                            <PlusIcon className="w-5 h-5"/>
                            <span>ثبت اقدام دستی</span>
                        </button>
                    </div>

                    {/* Timeline items will go here */}
                    {/* Combine and sort logs, followups, etc. */}
                </div>
                 {selectedEntry.type === 'diagnosis' && (
                     <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">پیگیری اثربخشی درمان</h3>
                        <input type="file" accept="image/*" ref={followUpFileInputRef} onChange={handleFollowUpFileChange} className="hidden" />
                        <button onClick={() => followUpFileInputRef.current?.click()} disabled={isAssessing} className="flex w-full justify-center items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-green-500 hover:bg-green-50/50 transition-colors disabled:opacity-50">
                            <CameraIcon className="w-5 h-5"/>
                            <span>{isAssessing ? 'در حال ارزیابی...' : 'آپلود عکس پس از درمان'}</span>
                        </button>
                        {isAssessing && <Spinner />}
                        {assessmentError && <p className="text-red-600 text-sm mt-2">{assessmentError}</p>}
                        
                        <div className="mt-4 space-y-4">
                            {selectedEntry.followUps?.map(f => (
                                <div key={f.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                                    <img src={f.imageDataUrl} alt="Follow-up" className="rounded-md w-full object-cover aspect-square"/>
                                    <div className="md:col-span-2">
                                        <p className="text-sm font-semibold text-gray-600">{new Date(f.date).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                        <h4 className="font-bold text-gray-800 mt-1">ارزیابی هوش مصنوعی</h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{f.assessment}</p>
                                    </div>
                                </div>
                            )).reverse()}
                        </div>
                     </div>
                 )}
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">دفتر مزرعه</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {logbook.map(entry => (
                    <div key={entry.id} className="relative group">
                        <button
                            onClick={() => setSelectedEntry(entry)}
                            className="w-full text-left bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            <img src={entry.imageDataUrl} alt={entry.type === 'identification' ? entry.plantInfo.plantName : entry.diagnosis.diagnoses[0].issueName} className="w-full h-32 object-cover" />
                            <div className="p-3">
                                <p className="font-semibold text-gray-800 truncate group-hover:whitespace-normal">
                                  {entry.type === 'identification' ? entry.plantInfo.plantName : entry.diagnosis.diagnoses[0].issueName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(entry.date).toLocaleDateString('fa-IR')}
                                </p>
                            </div>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                            className="absolute top-1.5 right-1.5 z-10 p-1 bg-white/70 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
             {showLogModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20" onClick={() => setShowLogModal(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">ثبت اقدام دستی</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نوع اقدام</label>
                                <select value={logActionType} onChange={e => setLogActionType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white">
                                    <option>آبیاری</option>
                                    <option>کوددهی</option>
                                    <option>سم‌پاشی</option>
                                    <option>هرس</option>
                                    <option>سایر</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت</label>
                                <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)} placeholder="مثال: ۲۰۰ میلی‌لیتر کود ۲۰-۲۰-۲۰ استفاده شد." className="w-full h-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowLogModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">انصراف</button>
                                <button onClick={handleAddManualLog} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">ذخیره</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmLogbook;