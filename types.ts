
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