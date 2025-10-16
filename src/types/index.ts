
export interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  whatsapp?: string;
  license_count: number;
  access_expires_at: string;
  created_at: string;
  last_login?: string;
  is_admin: boolean;
  stories_progress: Record<string, boolean>;
  favorite_stories: string[];
  videos_progress?: Record<string, boolean>;
  favorite_videos?: string[];
  payment_history?: PaymentRecord[];
}

export interface Story {
  id: string;
  title: string;
  content: string;
  order_number: number;
  created_at: string;
  is_new?: boolean; // ✅ CAMPO ADICIONADO
  image_url?: string;
  pdf_url?: string;
  new_until?: string;
  testament?: 'old' | 'new';
  is_active?: boolean; // ✅ CAMPO ADICIONADO para compatibilidade
}

export interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  order_number: number;
  created_at: string;
  is_new?: boolean; // ✅ CAMPO ADICIONADO
  new_until?: string;
  testament?: 'old' | 'new';
  youtube_url?: string; // ✅ CAMPO ADICIONADO para compatibilidade
  is_active?: boolean; // ✅ CAMPO ADICIONADO para compatibilidade
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  licenses_purchased: number;
  payment_date: string;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
}
