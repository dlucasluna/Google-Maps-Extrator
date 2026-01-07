export interface BusinessContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  rating: string;
  type: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchResult {
  contacts: BusinessContact[];
  sources: GroundingSource[];
  rawText: string;
}

export enum SearchStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}