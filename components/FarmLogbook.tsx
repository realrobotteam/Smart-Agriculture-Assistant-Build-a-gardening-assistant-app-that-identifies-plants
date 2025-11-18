
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LogbookEntry, SavedPlant, DiseaseHistoryEntry, ManualLog, FollowUp, DiagnosisResult, ChemicalTreatment } from '../types';
import { evaluateTreatmentEffectiveness } from '../services/geminiService';
import Spinner from './Spinner';
import { LogbookIcon } from './icons/LogbookIcon';
import { TrashIcon } from './icons/TrashIcon';
import { WaterDropIcon, SunIcon, SoilIcon, FertilizerIcon, PruningIcon, AlertTriangleIcon } from './icons/CareIcons';
import { CameraIcon } from './icons/CameraIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { CauseIcon, TreatmentIcon } from './icons/DiagnosisIcons';
import { LeafIcon } from './icons/LeafIcon';


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

// --- Helper components copied from DiseaseDiagnoser for rendering details ---
const getSeverityStyles = (level: string) => {
    const levelNormalized = level?.toLowerCase() || '';
    if (levelNormalized.includes('کم')) {
      return { label: 'کم', color: 'bg-yellow-500', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    }
    if (levelNormalized.includes('متوسط')) {
      return { label: 'متوسط', color: 'bg-orange-500', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
    }
    if (levelNormalized.includes('زیاد')) {
      return { label: 'زیاد', color: 'bg-red-500', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    }
    if (levelNormalized.includes('بحرانی')) {
      return { label: 'بحرانی', color: 'bg-red-700', bgColor: 'bg-red-200', textColor: 'text-red-900' };
    }
    return { label: level || 'نامشخص', color: 'bg-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
};

const DetailCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white rounded-lg p-4 flex items-start gap-4">
        <div className="flex-shrink-0 text-green-600 bg-green-100 rounded-full p-2">{icon}</div>
        <div className="w-full">
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <div className="text-sm text-gray-600 mt-1">{children}</div>
        </div>
    </div>
);

const ChemicalTreatmentAction: React.FC<{ treatment: ChemicalTreatment }> = ({ treatment }) => (
    <div className="p-2 rounded-md hover:bg-green-50/50 border-b border-gray-100 last:border-b-0">
        <p className="font-semibold text-gray-800">{treatment.name}</p>
        <p className="text-xs text-gray-500 mb-1">گروه شیمیایی: {treatment.chemicalGroup}</p>
        <p className="text-sm text-gray-600">{treatment.instructions}</p>
    </div>
);

const TreatmentTabs: React.FC<{ treatments: DiagnosisResult['treatment'] }> = ({ treatments }) => {
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
                ? treatments.organic.map((t, i) => (
                    <div key={`org-${i}`} className="flex items-start gap-2 p-2 rounded-md hover:bg-green-50/50">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t}</span>
                    </div>
                ))
                : <p className="text-sm text-gray-500 px-2">روش درمانی ارگانیک یافت نشد.</p>
            )}
            {activeTab === 'chemical' && (treatments.chemical.length > 0
                ? treatments.chemical.map((t, i) => <ChemicalTreatmentAction key={`chem-${i}`} treatment={t} />)
                : <p className="text-sm text-gray-500 px-2">روش درمانی شیمیایی یافت نشد.</p>
            )}
            </div>
            {treatments.resistanceManagementNote && (
                <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 rounded-r-lg flex items-start gap-2 text-sm">
                <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <strong className="font-semibold">مدیریت مقاومت به سموم:</strong>
                    <p>{treatments.resistanceManagementNote}</p>
                </div>
            </div>
            )}
        </div>
    )
}

const DiagnosisCard: React.FC<{ diagnosis: DiagnosisResult }> = ({ diagnosis }) => {
    const { label, color, bgColor, textColor } = getSeverityStyles(diagnosis.severity.level);
    return (
        <div className={`p-4 rounded-lg shadow-sm border border-gray-200 bg-white space-y-3`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className={`text-xl font-bold ${textColor}`}>{diagnosis.issueName}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
                    {diagnosis.issueType}
                </span>
            </div>
            <p className="text-sm text-gray-600">{diagnosis.description}</p>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">شدت: {label}</span>
                    <span className={`text-sm font-bold ${textColor}`}>{diagnosis.severity.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`${color} h-2.5 rounded-full`} style={{ width: `${diagnosis.severity.percentage}%` }}></div>
                </div>
            </div>
             <DetailCard icon={<CauseIcon className="w-6 h-6" />} title="دلایل احتمالی">
                <ul className="list-disc list-inside space-y-1 pl-2">
                    {diagnosis.possibleCauses.map((cause, i) => <li key={i}>{cause}</li>)}
                </ul>
            </DetailCard>
            <DetailCard icon={<TreatmentIcon className="w-6 h-6" />} title="روش‌های درمان">
                <TreatmentTabs treatments={diagnosis.treatment} />
            </DetailCard>
            <DetailCard icon={<ShieldIcon className="w-6 h-6" />} title="پیشگیری">
                <ul className="list-disc list-inside space-y-1 pl-2">
                    {diagnosis.prevention.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
            </DetailCard>
        </div>
    );
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
// --- End Helper Components ---


const FarmLogbook: React.FC = () => {
    const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<LogbookEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showLogModal, setShowLogModal] = useState(false);
    const [logActionType, setLogActionType] = useState<ManualLog['actionType']>('آبیاری');
    const [logNotes, setLogNotes] = useState('');
    const [isAssessing, setIsAssessing] = useState(false);
    const [assessmentError, setAssessmentError] = useState<string | null>(null);
    const followUpFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // ... (migration logic remains the same)
        const logbookJSON = localStorage.getItem(FARM_LOGBOOK_KEY);
        if (logbookJSON) {
            setLogbook(JSON.parse(logbookJSON));
            setIsLoading(false);
            return;
        }

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
    
    const filteredLogbook = useMemo(() => {
        return logbook.filter(entry => {
            const entryDate = new Date(entry.date);
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (entryDate < start) return false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (entryDate > end) return false;
            }
            return true;
        });
    }, [logbook, startDate, endDate]);

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
    };

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
        setLogActionType('آبیاری');
    };

    const handleFollowUpFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedEntry || selectedEntry.type !== 'diagnosis') return;

        setIsAssessing(true);
        setAssessmentError(null);
        try {
            const base64ImageAfter = await fileToBase64(file);
            const assessmentText = await evaluateTreatmentEffectiveness(
                selectedEntry.imageDataUrl, 'image/jpeg',
                base64ImageAfter, file.type,
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
    
    const timelineEvents = useMemo(() => {
        if (!selectedEntry) return [];
        const events: { date: string; type: string; data: any }[] = [];
        events.push({ date: selectedEntry.date, type: selectedEntry.type, data: selectedEntry });
        if (selectedEntry.manualLogs) {
            selectedEntry.manualLogs.forEach(log => events.push({ date: log.date, type: 'manual_log', data: log }));
        }
        if (selectedEntry.type === 'diagnosis' && selectedEntry.followUps) {
            selectedEntry.followUps.forEach(fu => events.push({ date: fu.date, type: 'follow_up', data: fu }));
        }
        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedEntry]);

    const getTimelineIcon = (type: string) => {
        switch (type) {
            case 'identification': return <LeafIcon className="w-5 h-5 text-green-600" />;
            case 'diagnosis': return <ShieldIcon className="w-5 h-5 text-red-600" />;
            case 'manual_log': return <PlusIcon className="w-5 h-5 text-blue-600" />;
            case 'follow_up': return <CameraIcon className="w-5 h-5 text-purple-600" />;
            default: return <div className="w-5 h-5 bg-gray-400 rounded-full" />;
        }
    };
    
    if (isLoading) return <div className="p-10"><Spinner /></div>;
    
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
                    <button onClick={() => handleDeleteEntry(selectedEntry.id)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-300 bg-red-100 text-red-700 hover:bg-red-200">
                        <TrashIcon className="w-4 h-4" /><span>حذف</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div><img src={selectedEntry.imageDataUrl} alt="Logbook entry" className="rounded-lg shadow-md w-full object-cover aspect-square" /></div>
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        {selectedEntry.type === 'identification' ? (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800">{selectedEntry.plantInfo.plantName}</h2>
                                <p className="text-md text-gray-500 italic">{selectedEntry.plantInfo.scientificName}</p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800">{selectedEntry.diagnosis.diagnoses[0].issueName}</h2>
                                <p className="text-md text-gray-500">{selectedEntry.diagnosis.diagnoses[0].issueType}</p>
                            </>
                        )}
                        <p className="text-sm text-gray-500 mt-2">ثبت شده در: {new Date(selectedEntry.date).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">تاریخچه و اقدامات</h3>
                        <button onClick={() => setShowLogModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                            <PlusIcon className="w-5 h-5"/><span>ثبت اقدام دستی</span>
                        </button>
                    </div>
                    <div className="relative pl-8">
                        {timelineEvents.map((event, index) => (
                            <div key={`${event.type}-${event.data.id}`} className="relative pb-6">
                                {! (index === timelineEvents.length - 1) && <div className="absolute top-5 left-3.5 -ml-px h-full w-0.5 bg-gray-200"></div>}
                                <div className="flex items-start">
                                    <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-200">
                                        {getTimelineIcon(event.type)}
                                    </div>
                                    <div className="pr-4 w-full">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-gray-800">
                                                {event.type === 'identification' && 'گیاه شناسایی شد'}
                                                {event.type === 'diagnosis' && 'بیماری تشخیص داده شد'}
                                                {event.type === 'manual_log' && `اقدام دستی: ${event.data.actionType}`}
                                                {event.type === 'follow_up' && 'پیگیری ثبت شد'}
                                            </p>
                                            <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('fa-IR')}</p>
                                        </div>
                                        {event.type === 'manual_log' && <p className="text-sm text-gray-600">{event.data.notes}</p>}
                                        {event.type === 'follow_up' && <p className="text-sm text-gray-600 italic">"ارزیابی هوش مصنوعی: {event.data.assessment.substring(0, 80)}..."</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 {selectedEntry.type === 'identification' && (
                    <div className="space-y-3 bg-gray-50/80 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">دستورالعمل‌های مراقبت</h3>
                        <CareInstructionCard icon={<WaterDropIcon className="w-6 h-6" />} title="آبیاری" text={selectedEntry.plantInfo.careInstructions.watering} />
                        <CareInstructionCard icon={<SunIcon className="w-6 h-6" />} title="نور خورشید" text={selectedEntry.plantInfo.careInstructions.sunlight} />
                        <CareInstructionCard icon={<SoilIcon className="w-6 h-6" />} title="خاک" text={selectedEntry.plantInfo.careInstructions.soil} />
                        <CareInstructionCard icon={<FertilizerIcon className="w-6 h-6" />} title="کود" text={selectedEntry.plantInfo.careInstructions.fertilizer} />
                        <CareInstructionCard icon={<PruningIcon className="w-6 h-6" />} title="هرس" text={selectedEntry.plantInfo.careInstructions.pruning} />
                    </div>
                )}
                {selectedEntry.type === 'diagnosis' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">جزئیات کامل تشخیص</h3>
                        {selectedEntry.diagnosis.diagnoses.map((diag, index) => (
                            <DiagnosisCard key={index} diagnosis={diag} />
                        ))}
                    </div>
                 )}
                
                 {selectedEntry.type === 'diagnosis' && (
                     <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">پیگیری اثربخشی درمان</h3>
                        <input type="file" accept="image/*" ref={followUpFileInputRef} onChange={handleFollowUpFileChange} className="hidden" />
                        <button onClick={() => followUpFileInputRef.current?.click()} disabled={isAssessing} className="flex w-full justify-center items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-green-500 hover:bg-green-50/50 transition-colors disabled:opacity-50">
                            <CameraIcon className="w-5 h-5"/>
                            <span>{isAssessing ? 'در حال ارزیابی...' : 'آپلود عکس پس از درمان'}</span>
                        </button>
                        {isAssessing && <div className="py-2"><Spinner /></div>}
                        {assessmentError && <p className="text-red-600 text-sm mt-2">{assessmentError}</p>}
                        
                        <div className="mt-4 space-y-4">
                            {[...(selectedEntry.followUps || [])].reverse().map(f => (
                                <div key={f.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                                    <img src={f.imageDataUrl} alt="Follow-up" className="rounded-md w-full object-cover aspect-square"/>
                                    <div className="md:col-span-2">
                                        <p className="text-sm font-semibold text-gray-600">{new Date(f.date).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                        <h4 className="font-bold text-gray-800 mt-1">ارزیابی هوش مصنوعی</h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{f.assessment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                 )}
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">دفتر مزرعه</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap items-end gap-4">
                <h3 className="text-lg font-semibold text-gray-700 w-full sm:w-auto">فیلتر بر اساس تاریخ</h3>
                <div className="flex-1 min-w-[150px]">
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-600 mb-1">از تاریخ</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-600 mb-1">تا تاریخ</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                </div>
                {(startDate || endDate) && (
                    <button onClick={handleClearFilters} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors h-[42px]">پاک کردن</button>
                )}
            </div>

            {filteredLogbook.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredLogbook.map(entry => (
                        <div key={entry.id} className="relative group">
                            <button onClick={() => setSelectedEntry(entry)} className="w-full text-left bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                                <img src={entry.imageDataUrl} alt={entry.type === 'identification' ? entry.plantInfo.plantName : entry.diagnosis.diagnoses[0].issueName} className="w-full h-32 object-cover" />
                                <div className="p-3">
                                    <p className="font-semibold text-gray-800 truncate group-hover:whitespace-normal">
                                    {entry.type === 'identification' ? entry.plantInfo.plantName : entry.diagnosis.diagnoses[0].issueName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(entry.date).toLocaleDateString('fa-IR')}</p>
                                </div>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }} className="absolute top-1.5 right-1.5 z-10 p-1 bg-white/70 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 py-10"><p>هیچ موردی با فیلترهای اعمال شده یافت نشد.</p></div>
            )}

            {showLogModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20" onClick={() => setShowLogModal(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">ثبت اقدام دستی</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نوع اقدام</label>
                                <select value={logActionType} onChange={e => setLogActionType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white">
                                    <option>آبیاری</option><option>کوددهی</option><option>سم‌پاشی</option><option>هرس</option><option>سایر</option>
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
