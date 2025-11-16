
export interface PlantCareInstructions {
  watering: string;
  sunlight: string;
  soil: string;
  fertilizer: string;
  pruning: string;
}

export interface PlantInfo {
  plantName: string;
  scientificName: string;
  description: string;
  isPoisonous: boolean;
  careInstructions: PlantCareInstructions;
  error?: string;
}

export interface ChemicalTreatment {
  name: string;
  chemicalGroup: string;
  instructions: string;
}

export interface DiagnosisResult {
  issueType: 'بیماری' | 'آفت' | 'کمبود مواد مغذی';
  issueName: string;
  description: string;
  severity: {
    level: 'کم' | 'متوسط' | 'زیاد' | 'بحرانی';
    percentage: number;
  };
  possibleCauses: string[];
  treatment: {
    organic: string[];
    chemical: ChemicalTreatment[];
    resistanceManagementNote: string;
  };
  prevention: string[];
}

export interface PlantDiseaseInfo {
  diagnoses: DiagnosisResult[];
  overallHealthSummary: string;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface SavedChat {
  id: string;
  title: string;
  history: ChatMessage[];
  createdAt: string;
}

export interface Comment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  text: string;
  imageDataUrl?: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
}

export interface WeatherAlert {
  riskLevel: 'کم' | 'متوسط' | 'زیاد';
  diseaseName: string;
  reason: string;
  preventativeAction: string;
}

export interface WeatherAlertsInfo {
  locationName: string;
  overallSummary: string;
  alerts: WeatherAlert[];
  error?: string;
}

export interface VideoAnalysisSection {
  startTime: number;
  endTime: number;
  status: 'سالم' | 'مشکوک' | 'بیمار';
  description: string;
  issues: string[];
}

export interface PlantingDensityAnalysis {
  status: 'بهینه' | 'متراکم' | 'کم‌پشت';
  recommendation: string;
}

export interface VideoAnalysisResult {
  overallSummary: string;
  plantingDensity: PlantingDensityAnalysis;
  sections: VideoAnalysisSection[];
  error?: string;
}

export interface CalendarEvent {
  week: number;
  dateRange: string;
  stage: string;
  tasks: {
    taskType: 'کوددهی' | 'آبیاری' | 'سم‌پاشی' | 'هرس' | 'بازرسی' | 'برداشت' | 'سایر';
    description: string;
  }[];
}

export interface CropCalendarResult {
  cropName: string;
  locationName: string;
  plantingDate: string;
  schedule: CalendarEvent[];
  error?: string;
}


// --- Farm Logbook Types ---
export interface ManualLog {
  id: string;
  date: string;
  actionType: 'آبیاری' | 'کوددهی' | 'سم‌پاشی' | 'هرس' | 'سایر';
  notes: string;
}

export interface FollowUp {
  id: string;
  date: string;
  imageDataUrl: string;
  assessment: string; 
}

export interface SavedPlant {
  id: string;
  type: 'identification';
  date: string; 
  imageDataUrl: string;
  plantInfo: PlantInfo;
  manualLogs?: ManualLog[];
  notes?: string;
}

export interface DiseaseHistoryEntry {
  id: string;
  type: 'diagnosis';
  date: string;
  imageDataUrl: string;
  diagnosis: PlantDiseaseInfo;
  manualLogs?: ManualLog[];
  followUps?: FollowUp[];
}

export type LogbookEntry = SavedPlant | DiseaseHistoryEntry;
