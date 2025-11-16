
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

export interface SavedPlant {
  id: string;
  imageDataUrl: string;
  plantInfo: PlantInfo;
  notes?: string;
}

export interface PlantDiseaseInfo {
  diseaseName: string;
  description: string;
  severity: string;
  possibleCauses: string[];
  treatment: {
    organic: string[];
    chemical: string[];
  };
  prevention: string[];
  error?: string;
}

export interface DiseaseHistoryEntry {
  id: string;
  date: string;
  imageDataUrl: string;
  diagnosis: PlantDiseaseInfo;
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
