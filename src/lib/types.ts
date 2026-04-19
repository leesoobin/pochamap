export type FoodType = 'chicken_skewer' | 'bungeobbang' | 'takoyaki'

export type LocationStatus = 'approved' | 'closed'
export type ReportStatus = 'pending' | 'approved' | 'rejected'

export interface Location {
  id: string
  type: FoodType
  name: string
  address: string
  lat: number
  lng: number
  price: string | null
  hours: string | null
  description: string | null
  status: LocationStatus
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  location_id: string | null
  type: FoodType
  name: string
  address: string
  lat: number
  lng: number
  price: string | null
  hours: string | null
  description: string | null
  photo_url: string | null
  reporter_memo: string | null
  status: ReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export const FOOD_LABELS: Record<FoodType, string> = {
  chicken_skewer: '닭꼬치',
  bungeobbang: '붕어빵',
  takoyaki: '타코야끼',
}

export const FOOD_EMOJI: Record<FoodType, string> = {
  chicken_skewer: '🍢',
  bungeobbang: '🐟',
  takoyaki: '🐙',
}

export const FOOD_COLORS: Record<FoodType, string> = {
  chicken_skewer: '#FF6B35',
  bungeobbang: '#FFB347',
  takoyaki: '#9B59B6',
}
