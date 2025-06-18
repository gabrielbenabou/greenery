// Types and constants for consumption tracking
export interface ConsumptionEntry {
  id: string
  user_id: string
  product_name: string
  amount: number
  unit: string
  notes?: string
  rating?: number
  consumption_method?: string
  consumable_id?: string
  units_consumed?: number
  consumed_at: string
  created_at: string
  updated_at: string
}

export interface RawProduct {
  id: string
  user_id: string
  product_type: string
  strain_name: string
  source?: string
  quality_notes?: string
  thc_content?: number
  current_amount: number
  original_amount: number
  unit: string
  purchase_date: string
  cost?: number
  created_at: string
  updated_at: string
}

export interface Consumable {
  id: string
  user_id: string
  consumable_type: string
  name: string
  quantity: number
  grams_per_unit: number
  source_strain?: string
  thc_content?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface ToleranceTracking {
  id: string
  user_id: string
  tracking_date: string
  baseline_amount: number
  effectiveness_rating: number
  tolerance_break_start?: string
  tolerance_break_end?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface BudgetSettings {
  id: string
  user_id: string
  monthly_budget: number
  weekly_budget?: number
  alert_threshold: number
  email_alerts: boolean
  push_alerts: boolean
  created_at: string
  updated_at: string
}

export interface BudgetAlert {
  id: string
  user_id: string
  alert_type: string
  current_spending: number
  budget_limit: number
  percentage_used: number
  alert_date: string
  acknowledged: boolean
  acknowledged_at?: string
}

export interface MoodTracking {
  id: string
  user_id: string
  consumption_entry_id: string
  pre_mood_energy: number
  pre_mood_happiness: number
  pre_mood_stress: number
  pre_mood_focus: number
  pre_mood_anxiety: number
  pre_mood_pain: number
  post_mood_energy?: number
  post_mood_happiness?: number
  post_mood_stress?: number
  post_mood_focus?: number
  post_mood_anxiety?: number
  post_mood_pain?: number
  effects_onset_minutes?: number
  effects_duration_minutes?: number
  effects_intensity?: number
  experience_rating?: number
  side_effects?: string[]
  mood_notes?: string
  environment?: string
  activity?: string
  created_at: string
  updated_at: string
}

export interface StrainEffect {
  id: string
  user_id: string
  strain_name: string
  product_type: string
  dominant_effects: string[]
  medical_benefits: string[]
  common_side_effects: string[]
  best_time_of_day?: string
  recommended_for: string[]
  user_rating?: number
  notes?: string
  sessions_count: number
  avg_mood_improvement?: number
  created_at: string
  updated_at: string
}

export interface MoodCorrelation {
  id: string
  user_id: string
  strain_name?: string
  consumption_method?: string
  avg_energy_change: number
  avg_happiness_change: number
  avg_stress_change: number
  avg_focus_change: number
  avg_anxiety_change: number
  avg_pain_change: number
  sessions_count: number
  last_updated: string
}

// Raw product types for inventory (simplified)
export const RAW_PRODUCT_TYPES = {
  "Flower-Buds": { label: "Flower Buds", defaultUnit: "g" },
  Hash: { label: "Hash", defaultUnit: "g" },
} as const

export type RawProductType = keyof typeof RAW_PRODUCT_TYPES

// Consumable types with default weights
export const CONSUMABLE_TYPES = {
  Joints: { label: "Joints", defaultWeight: 0.6, unit: "units" },
  Cartridges: { label: "Cartridges", defaultWeight: 0.33, unit: "units" },
  Edibles: { label: "Edibles", defaultWeight: 1.0, unit: "units" },
} as const

export type ConsumableType = keyof typeof CONSUMABLE_TYPES

// Consumption method efficiency rates
export const CONSUMPTION_METHODS = {
  Smoked: { efficiency: 0.2, label: "Smoked (20% efficiency)" },
  Vaporised: { efficiency: 0.4, label: "Vaporised (40% efficiency)" },
  Eaten: { efficiency: 0.6, label: "Eaten (60% efficiency)" },
} as const

export type ConsumptionMethod = keyof typeof CONSUMPTION_METHODS

// Legacy product configurations (for backward compatibility)
export const PRODUCTS = {
  Cartridges: { defaultAmount: 0.33, unit: "g" },
  Johnnies: { defaultAmount: 0.6, unit: "g" },
  Grams: { defaultAmount: 1.0, unit: "g" },
  Joints: { defaultAmount: 0.6, unit: "g" },
  Edibles: { defaultAmount: 1.0, unit: "g" },
} as const

export type ProductType = keyof typeof PRODUCTS

// Mood categories and their descriptions
export const MOOD_CATEGORIES = {
  energy: { label: "Energy Level", description: "How energetic do you feel?" },
  happiness: { label: "Happiness", description: "How happy/content do you feel?" },
  stress: { label: "Stress Level", description: "How stressed do you feel?" },
  focus: { label: "Focus", description: "How focused/clear-minded do you feel?" },
  anxiety: { label: "Anxiety Level", description: "How anxious do you feel?" },
  pain: { label: "Pain Level", description: "How much physical discomfort do you feel?" },
} as const

export type MoodCategory = keyof typeof MOOD_CATEGORIES

// Common side effects
export const COMMON_SIDE_EFFECTS = [
  "Dry mouth",
  "Red eyes",
  "Increased appetite",
  "Drowsiness",
  "Dizziness",
  "Paranoia",
  "Anxiety",
  "Couch lock",
  "Giggles",
  "Euphoria",
  "Relaxation",
  "Creativity boost",
  "Pain relief",
  "Nausea relief",
] as const

// Environment options
export const ENVIRONMENTS = [
  "Home - Indoor",
  "Home - Outdoor",
  "Friend's place",
  "Nature/Park",
  "Concert/Event",
  "Restaurant/Bar",
  "Work",
  "Car",
  "Other",
] as const

// Activity options
export const ACTIVITIES = [
  "Relaxing",
  "Watching TV/Movies",
  "Gaming",
  "Reading",
  "Exercising",
  "Socializing",
  "Working",
  "Cooking",
  "Cleaning",
  "Creative work",
  "Music",
  "Walking",
  "Meditation",
  "Sleep preparation",
  "Other",
] as const
