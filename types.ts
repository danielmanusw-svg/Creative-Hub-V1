
export enum AppView {
  CREATIVES = 'Creatives',
  EDITOR = 'Editor',
  VA = 'VA',
  REVIEW = 'Review'
}

export interface Variant {
  id: string;
  headerId: string;
  name: string;
  status: string;
  createdDate: string;
  launchDate: string;
  reviewDate: string;
  compDate?: string;
  editDate?: string;
  landingPage: string;

  target: string;
  concept: string;
  scriptLink?: string;
  videoLink?: string;
  rejectionHistory?: { source: 'Editor' | 'VA'; message: string; destination?: 'Strategist' | 'Editor' }[];
  reviewStatus?: string;
}

export interface StrategyItem {
  id: string;
  product: string;
  format: string;
  batchCode?: string;
  description: string;
  variants: Variant[];
}

export interface NavItem {
  id: AppView;
  label: string;
  icon: string;
}
