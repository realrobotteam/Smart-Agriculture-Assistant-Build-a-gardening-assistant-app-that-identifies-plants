
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
  possibleCauses: string[];
  treatment: {
    organic: string[];
    chemical: string[];
  };
  prevention: string[];
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}