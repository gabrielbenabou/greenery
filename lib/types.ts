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
    strain_name: string
    type: RawProductType
    purchase_date: string
    cost: number
    total_amount: number
    remaining_amount: number
    thc_content?: number
    cbd_content?: number
    terpene_profile?: string
    created_at: string
}

export interface Consumable {
    id: string
    user_id: string
    type: ConsumableType
    name: string
    product_id?: string
    total_units: number
    remaining_units: number
    weight_per_unit: number
    cost_per_unit: number
    created_at: string
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
    Smoked: { efficiency: 0.2, label: "Smoked (20% efficiency)", icon: "flame" },
    Vaporised: { efficiency: 0.4, label: "Vaporised (40% efficiency)", icon: "wind" },
    Eaten: { efficiency: 0.6, label: "Eaten (60% efficiency)", icon: "cookie" },
    Tincture: { efficiency: 0.5, label: "Tincture", icon: "droplet" },
    Topical: { efficiency: 0.3, label: "Topical", icon: "hand" }
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
    relaxed: { label: "Relaxed", icon: "palmtree", description: "Feeling calm and at ease" },
    euphoric: { label: "Euphoric", icon: "smile", description: "Feeling intense happiness or joy" },
    creative: { label: "Creative", icon: "paintbrush", description: "Enhanced creative thinking" },
    focused: { label: "Focused", icon: "target", description: "Improved concentration" },
    sleepy: { label: "Sleepy", icon: "moon", description: "Feeling drowsy or sedated" },
    energy: { label: "Energy Level", icon: "zap", description: "How energetic do you feel?" },
    happiness: { label: "Happiness", icon: "heart", description: "How happy/content do you feel?" },
    stress: { label: "Stress Level", icon: "alert-triangle", description: "How stressed do you feel?" },
    anxiety: { label: "Anxiety Level", icon: "cloud-lightning", description: "How anxious do you feel?" },
    pain: { label: "Pain Level", icon: "thermometer", description: "How much physical discomfort do you feel?" }
} as const

export type MoodCategory = keyof typeof MOOD_CATEGORIES

// Common side effects
export const COMMON_SIDE_EFFECTS = {
    dryMouth: { label: "Dry Mouth", icon: "droplet-slash" },
    hunger: { label: "Increased Hunger", icon: "utensils" },
    redEyes: { label: "Red Eyes", icon: "eye" },
    paranoia: { label: "Paranoia", icon: "alert-triangle" },
    anxiety: { label: "Anxiety", icon: "heart" },
    dizziness: { label: "Dizziness", icon: "dizzy" },
    drowsiness: { label: "Drowsiness", icon: "moon" },
    couchLock: { label: "Couch lock", icon: "anchor" },
    giggles: { label: "Giggles", icon: "smile" },
    euphoria: { label: "Euphoria", icon: "zap" },
    relaxation: { label: "Relaxation", icon: "feather" },
    creativity: { label: "Creativity boost", icon: "paintbrush" },
    painRelief: { label: "Pain relief", icon: "shield" },
    nauseaRelief: { label: "Nausea relief", icon: "check-circle" }
} as const

// Environment options
export const ENVIRONMENTS = {
    home: { label: "Home", icon: "home" },
    outdoors: { label: "Outdoors", icon: "tree" },
    social: { label: "Social", icon: "users" },
    work: { label: "Work", icon: "briefcase" },
    "friend's-place": { label: "Friend's place", icon: "map-pin" },
    nature: { label: "Nature/Park", icon: "mountain" },
    event: { label: "Concert/Event", icon: "music" },
    restaurant: { label: "Restaurant/Bar", icon: "coffee" },
    car: { label: "Car", icon: "car" },
    other: { label: "Other", icon: "more-horizontal" }
} as const

// Activity options
export const ACTIVITIES = {
    relaxing: { label: "Relaxing", icon: "sofa" },
    creative: { label: "Creative Work", icon: "paintbrush" },
    physical: { label: "Physical Activity", icon: "activity" },
    entertainment: { label: "Entertainment", icon: "film" },
    social: { label: "Socializing", icon: "users" },
    work: { label: "Work/Studying", icon: "book" },
    watching: { label: "Watching TV/Movies", icon: "tv" },
    gaming: { label: "Gaming", icon: "gamepad" },
    reading: { label: "Reading", icon: "book-open" },
    cooking: { label: "Cooking", icon: "utensils" },
    cleaning: { label: "Cleaning", icon: "trash" },
    music: { label: "Music", icon: "music" },
    walking: { label: "Walking", icon: "walking" },
    meditation: { label: "Meditation", icon: "feather" },
    sleep: { label: "Sleep preparation", icon: "moon" },
    other: { label: "Other", icon: "more-horizontal" }
} as const
