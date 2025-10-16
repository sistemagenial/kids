
/**
 * Banco de dados MySQL - Conexão com hospedagem LOCAL
 * ✅ REMOVIDO COMPLETAMENTE O SUPABASE - APENAS MYSQL LOCAL
 */

// 🔧 CORREÇÃO: Declarações TypeScript para propriedades específicas do navegador
declare global {
  interface Window {
    chrome?: any;
    InstallTrigger?: any;
    webkitAudioContext?: any;
  }
}

// Garante que o TS não reclame da verificação global
declare const InstallTrigger: any;

/**
 * Banco de dados MySQL - Conexão com hospedagem LOCAL
 * ✅ REMOVIDO COMPLETAMENTE O SUPABASE - APENAS MYSQL LOCAL
 */
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
}

export interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  order_number: number;
  created_at: string;
  is_new?: boolean; // ✅ CAMPO ADICIONADO
  new_until?: string;
  testament?: 'old' | 'new';
}

export interface UserProgress {
  id: string;
  user_id: string;
  story_id: string;
  completed: boolean;
  completed_at: string;
}

export interface DeviceInfo {
  id: string;
  user_id: string;
  device_id: string;
  name: string;
  type: string;
  last_access: string;
  ip: string;
  is_active: boolean;
  session_token?: string;
  browser?: string;
  os?: string;
  screen?: string;
  userAgent?: string;
}

export interface PurchaseOrder {
  id: string;
  name: string;
  email: string;
  cpf: string;
  whatsapp: string;
  plan: 'basic' | 'pro' | 'premium';
  planDetails: {
    name: string;
    devices: number;
    price: string;
  };
  status: 'pending' | 'paid' | 'user_created';
  created_at: string;
  user_created_at?: string;
  notes?: string;
}

// 🔧 CORRIGIDO: Base URL da API - APENAS MYSQL LOCAL
const API_BASE_URL = 'https://profetadedeus.com.br/kids/api';

// ✅ OTIMIZAÇÃO: Funções de cache local
const CACHE_DURATION = {
  STORIES: 5 * 60 * 1000, // 5 minutos
  VIDEOS: 5 * 60 * 1000, // 5 minutos
  USERS: 3 * 60 * 1000, // 3 minutos (dados mais dinâmicos)
};

function getCachedData(key: string, duration: number) {
  const cached = localStorage.getItem(key);
  const cachedTime = localStorage.getItem(`${key}_time`);

  if (cached && cachedTime) {
    const now = Date.now();
    const cacheTime = parseInt(cachedTime, 10);

    if (now - cacheTime < duration) {
      console.log(`📦 Usando cache local: ${key}`);
      return JSON.parse(cached);
    }
  }

  return null;
}

function setCachedData(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data));
  localStorage.setItem(`${key}_time`, Date.now().toString());
}

function clearCache(pattern: string) {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      localStorage.removeItem(key);
    }
  });
}

// Função helper para fazer requisições - APENAS MYSQL
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    console.log('🔍 Fazendo requisição para:', `${API_BASE_URL}${endpoint}`);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log('📡 Status da resposta:', response.status);

    // ✅ CORREÇÃO: Verificar se a resposta está vazia de forma mais robusta
    const text = await response.text();
    console.log('📄 Resposta recebida (primeiros 500 chars):', text.substring(0, 500));

    // ✅ CORREÇÃO: Verificar resposta vazia
    if (!text || text.trim() === '') {
      console.error('❌ Resposta vazia do servidor');
      throw new Error('Resposta vazia do servidor - verifique os logs do PHP');
    }

    // ✅ CORREÇÃO: Verificar se não é uma página de erro HTML
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.error('❌ Servidor retornou HTML em vez de JSON:', text.substring(0, 200));
      throw new Error('Servidor retornou página HTML - possível erro 404 ou 500');
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: `HTTP ${response.status} - ${text.substring(0, 100)}` };
      }
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    try {
      const jsonData = JSON.parse(text);
      console.log('✅ JSON parseado com sucesso');

      // 🔧 VERIFICAR SE HÁ ERRO NA RESPOSTA
      if (jsonData.error) {
        throw new Error(jsonData.error);
      }

      return jsonData;
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      console.error('📄 Texto recebido completo:', text);
      
      // ✅ CORREÇÃO: Verificar se parseError é uma instância de Error
      if (parseError instanceof Error) {
        // ✅ CORREÇÃO: Erro mais específico
        if (text.includes('Parse error') || text.includes('Fatal error')) {
          throw new Error('Erro de sintaxe no PHP - verifique os logs do servidor');
        } else if (text.includes('Warning') || text.includes('Notice')) {
          throw new Error('Avisos PHP detectados - verifique a configuração');
        } else {
          throw new Error(`Resposta inválida do servidor: ${parseError.message}`);
        }
      } else {
        // ✅ CORREÇÃO: Caso parseError não seja um Error
        throw new Error('Resposta inválida do servidor: erro desconhecido');
      }
    }
  } catch (error) {
    console.error('❌ Erro na requisição API:', error);
    throw error;
  }
}

/* Funções para Usuários - APENAS MYSQL */
export const createUser = async (userData: Omit<User, 'id' | 'created_at'>) => {
  try {
    const result = await apiRequest('/users.php?action=create', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache de usuários após criação
    clearCache('cached_users');

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    console.log('🔐 Tentando login com:', { email, password: password.substring(0, 3) + '***' });

    const result = await apiRequest('/users.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data) {
      // 🔧 CORRIGIDO: Normalizar tipos de dados no login
      const normalizedUser = {
        ...result.data,
        id: String(result.data.id),
        license_count: Number(result.data.license_count),
        is_admin: Boolean(result.data.is_admin),
      };

      console.log('✅ Resultado do login normalizado:', normalizedUser);
      return { data: normalizedUser, error: null };
    }

    return { data: result.data, error: null };
  } catch (error: any) {
    console.error('❌ Erro no login:', error.message);
    return { data: null, error: error.message };
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    // ✅ OTIMIZAÇÃO: Cache por email
    const cacheKey = `cached_user_email_${btoa(email)}`;
    const cached = getCachedData(cacheKey, CACHE_DURATION.USERS);
    if (cached) return { data: cached, error: null };

    const result = await apiRequest(`/users.php?action=by-email&email=${encodeURIComponent(email)}`);

    if (result.data) {
      // 🔧 CORRIGIDO: Normalizar tipos de dados
      const normalizedUser = {
        ...result.data,
        id: String(result.data.id),
        license_count: Number(result.data.license_count),
        is_admin: Boolean(result.data.is_admin),
      };

      setCachedData(cacheKey, normalizedUser);
      return { data: normalizedUser, error: null };
    }

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  try {
    // 🔧 CORRIGIDO: Lógica de renovação - adicionar 365 dias à data atual de expiração
    const updatesWithRenewal = { ...updates };

    if (updates.access_expires_at === 'renew') {
      // Sinalizar para o backend que é uma renovação
      updatesWithRenewal.access_expires_at = 'renew';
    }

    const result = await apiRequest('/users.php?action=update', {
      method: 'PUT',
      body: JSON.stringify({ id: userId, ...updatesWithRenewal }),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache de usuários após atualização
    clearCache('cached_user');

    if (result.data) {
      // 🔧 CORRIGIDO: Normalizar tipos de dados na resposta
      const normalizedUser = {
        ...result.data,
        id: String(result.data.id),
        license_count: Number(result.data.license_count),
        is_admin: Boolean(result.data.is_admin),
      };

      return { data: normalizedUser, error: null };
    }

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    // ✅ OTIMIZAÇÃO: Cache para lista de usuários
    const cacheKey = 'cached_users_all';
    const cached = getCachedData(cacheKey, CACHE_DURATION.USERS);
    if (cached) return { data: cached, error: null };

    const result = await apiRequest('/users.php?action=all');

    if (result.data) {
      // 🔧 CORRIGIDO: Normalizar license_count como número
      const normalizedData = result.data.map((user: any) => ({
        ...user,
        id: String(user.id), // ID como string
        license_count: Number(user.license_count), // license_count como número
        is_admin: Boolean(user.is_admin), // is_admin como boolean
      }));

      setCachedData(cacheKey, normalizedData);
      return { data: normalizedData, error: null };
    }

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const changeAdminPassword = async (currentPassword: string, newPassword: string) => {
  try {
    const result = await apiRequest('/users.php?action=change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return { success: result.success, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteUser = async (userId: string) => {
  try {
    await apiRequest(`/users.php?action=delete&id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });

    // ✅ OTIMIZAÇÃO: Limpar cache de usuários após exclusão
    clearCache('cached_user');

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

/* 🆕 NOVА ФУНКЦИЯ: Deletar múltiplos usuários */
export const deleteMultipleUsers = async (userIds: string[]) => {
  try {
    const result = await apiRequest('/users.php?action=delete-multiple', {
      method: 'POST',
      body: JSON.stringify({ ids: userIds }),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache de usuários após exclusão múltipla
    clearCache('cached_user');

    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

/* 🆕 NOVА ФУНКЦИЯ: Renovar múltiplos usuários */
export const renewMultipleUsers = async (userIds: string[]) => {
  try {
    const result = await apiRequest('/users.php?action=renew-multiple', {
      method: 'POST',
      body: JSON.stringify({ ids: userIds }),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache de usuários após renovação múltipla
    clearCache('cached_user');

    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

/* ФУНКЦИЯ: Alterar plano de múltiplos usuários */
export const changeMultipleUsersPlans = async (userIds: string[], licenseCount: number) => {
  try {
    const result = await apiRequest('/users.php?action=change-plan-multiple', {
      method: 'POST',
      body: JSON.stringify({ ids: userIds, license_count: licenseCount }),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache de usuários após alteração de plano múltipla
    clearCache('cached_user');

    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

/* Funções para Histórias - APENAS MYSQL */
export const getAllStories = async () => {
  try {
    // ✅ OTIMIZAÇÃO: Cache local de 5 minutos
    const cacheKey = 'cached_stories';
    const cached = getCachedData(cacheKey, CACHE_DURATION.STORIES);
    if (cached) return { data: cached, error: null };

    const result = await apiRequest('/stories.php?action=all');

    // 🔧 CORRIGIDO: Normalizar IDs como string e garantir order_number
    if (result.data) {
      const mappedData = result.data.map((story: any) => ({
        ...story,
        id: String(story.id), // NORMALIZAR ID COMO STRING
        order_number: story.order_number || story.position_number || 1, // Garantir compatibilidade
      }));

      setCachedData(cacheKey, mappedData);
      return { data: mappedData, error: null };
    }

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const getStoryById = async (storyId: string) => {
  try {
    // ✅ OTIMIZAÇÃO: Cache individual por história
    const cacheKey = `cached_story_${storyId}`;
    const cached = getCachedData(cacheKey, CACHE_DURATION.STORIES);
    if (cached) return { data: cached, error: null };

    const result = await apiRequest(`/stories.php?action=by-id&id=${encodeURIComponent(storyId)}`);

    if (result.data) {
      // NORMALIZAR ID COMO STRING
      const normalizedStory = {
        ...result.data,
        id: String(result.data.id),
        order_number: result.data.order_number || result.data.position_number || 1,
      };
      setCachedData(cacheKey, normalizedStory);
      return { data: normalizedStory, error: null };
    }

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const createStory = async (storyData: any) => {
  try {
    const result = await apiRequest('/stories.php?action=create', {
      method: 'POST',
      body: JSON.stringify(storyData),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache após modificação
    clearCache('cached_stories');

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const updateStory = async (id: string, storyData: any) => {
  try {
    const result = await apiRequest('/stories.php?action=update', {
      method: 'PUT',
      body: JSON.stringify({ id, ...storyData }),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache após modificação
    clearCache('cached_stories');

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const deleteStory = async (storyId: string) => {
  try {
    await apiRequest(`/stories.php?action=delete&id=${encodeURIComponent(storyId)}`, {
      method: 'DELETE',
    });

    // ✅ OTIMIZAÇÃO: Limpar cache após modificação
    clearCache('cached_stories');

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

/* 🆕 NOVА ФУНКЦИЯ: Deletar múltiplas histórias */
export const deleteMultipleStories = async (storyIds: string[]) => {
  try {
    const result = await apiRequest('/stories.php?action=delete-multiple', {
      method: 'POST',
      body: JSON.stringify({ ids: storyIds }),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache após modificação
    clearCache('cached_stories');

    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

/* Funções para Vídeos - APENAS MYSQL */
export const getAllVideos = async () => {
  try {
    // ✅ OTIMIZAÇÃO: Cache local de 5 minutos
    const cacheKey = 'cached_videos';
    const cached = getCachedData(cacheKey, CACHE_DURATION.VIDEOS);
    if (cached) return { data: cached, error: null };

    const result = await apiRequest('/videos.php?action=all');

    // 🔧 CORRIGIDO: Normalizar IDs como string e garantir order_number
    if (result.data) {
      const mappedData = result.data.map((video: any) => ({
        ...video,
        id: String(video.id), // NORMALIZAR ID COMO STRING
        order_number: video.order_number || video.position_number || 1, // Garantir compatibilidade
      }));

      setCachedData(cacheKey, mappedData);
      return { data: mappedData, error: null };
    }

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const getVideoById = async (videoId: string) => {
  try {
    // ✅ OTIMIZAÇÃO: Cache individual por vídeo
    const cacheKey = `cached_video_${videoId}`;
    const cached = getCachedData(cacheKey, CACHE_DURATION.VIDEOS);
    if (cached) return { data: cached, error: null };

    const result = await apiRequest(`/videos.php?action=by-id&id=${encodeURIComponent(videoId)}`);

    if (result.data) {
      // NORMALIZAR ID COMO STRING
      const normalizedVideo = {
        ...result.data,
        id: String(result.data.id),
        order_number: result.data.order_number || result.data.position_number || 1,
      };
      setCachedData(cacheKey, normalizedVideo);
      return { data: normalizedVideo, error: null };
    }

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const createVideo = async (videoData: any) => {
  try {
    const result = await apiRequest('/videos.php?action=create', {
      method: 'POST',
      body: JSON.stringify(videoData),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache após modificação
    clearCache('cached_videos');

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const updateVideo = async (id: string, videoData: any) => {
  try {
    const result = await apiRequest('/videos.php?action=update', {
      method: 'PUT',
      body: JSON.stringify({ id, ...videoData }),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache após modificação
    clearCache('cached_videos');

    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const deleteVideo = async (videoId: string) => {
  try {
    await apiRequest(`/videos.php?action=delete&id=${encodeURIComponent(videoId)}`, {
      method: 'DELETE',
    });

    // ✅ OTIMIZAÇÃO: Limpar cache após modificação
    clearCache('cached_videos');

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

/* 🆕 NOVА ФУНКЦИЯ: Deletar múltiplos vídeos */
export const deleteMultipleVideos = async (videoIds: string[]) => {
  try {
    const result = await apiRequest('/videos.php?action=delete-multiple', {
      method: 'POST',
      body: JSON.stringify({ ids: videoIds }),
    });

    // ✅ OTIMIZAÇÃO: Limpar cache após modificação
    clearCache('cached_videos');

    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

/* Funções para Progresso do Usuário - APENAS MYSQL */
export const getUserProgress = async (userId: string) => {
  try {
    const result = await apiRequest(`/progress.php?action=user-progress&user_id=${encodeURIComponent(userId)}`);
    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const updateUserProgress = async (userId: string, storyId: string, completed: boolean) => {
  try {
    const result = await apiRequest('/progress.php?action=update', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, story_id: storyId, completed }),
    });
    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

/* Funções para Dispositivos - APENAS MYSQL */
export const getUserDevices = async (userId: string) => {
  try {
    const result = await apiRequest(`/devices.php?action=user-devices&user_id=${encodeURIComponent(userId)}`);
    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const checkDeviceLimit = async (userId: string, deviceId: string) => {
  try {
    const result = await apiRequest(
      `/devices.php?action=check-device-limit&user_id=${encodeURIComponent(userId)}&device_id=${encodeURIComponent(deviceId)}`
    );
    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const registerDevice = async (deviceData: Omit<DeviceInfo, 'id'>) => {
  try {
    // 🔧 CORREÇÃO: Verificar se já existe um dispositivo ativo para este device_id
    // Se existir, apenas atualizar o last_access em vez de criar novo registro
    const result = await apiRequest('/devices.php?action=register', {
      method: 'POST',
      body: JSON.stringify({
        ...deviceData,
        update_existing: true // Flag para atualizar registro existente
      }),
    });
    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const removeDevice = async (userId: string, deviceId: string) => {
  try {
    // 🔧 CORREÇÃO: Usar session_token para identificar sessão específica
    const sessionToken = getCurrentSessionToken();
    
    const result = await apiRequest('/devices.php?action=remove', {
      method: 'DELETE',
      body: JSON.stringify({
        user_id: userId,
        device_id: deviceId,
        session_token: sessionToken
      }),
    });
    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const logoutDevice = async (sessionToken: string) => {
  try {
    const result = await apiRequest('/devices.php?action=logout-device', {
      method: 'POST',
      body: JSON.stringify({ session_token: sessionToken }),
    });
    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

/* Funções para Pedidos de Compra - APENAS MYSQL */
export const createPurchaseOrder = async (
  orderData: Omit<PurchaseOrder, 'id' | 'created_at' | 'status'>
) => {
  try {
    const result = await apiRequest('/orders.php?action=create', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const getAllPurchaseOrders = async () => {
  try {
    const result = await apiRequest('/orders.php?action=all');
    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const updatePurchaseOrderStatus = async (
  orderId: string,
  status: PurchaseOrder['status'],
  notes?: string
) => {
  try {
    const result = await apiRequest('/orders.php?action=update-status', {
      method: 'PUT',
      body: JSON.stringify({ id: orderId, status, notes }),
    });
    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const createUserFromOrder = async (orderId: string) => {
  try {
    const result = await apiRequest('/orders.php?action=create-user-from-order', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

/* Funções para Gerenciamento de Sessão - LOCAL */
export const getCurrentSessionToken = (): string | null => {
  return localStorage.getItem('session_token');
};

export const setSessionToken = (token: string): void => {
  localStorage.setItem('session_token', token);
};

export const clearSessionToken = (): void => {
  localStorage.removeItem('session_token');
};

// 🔧 CORRIGIDO: Device ID único e persistente por dispositivo FÍSICO (não por aba)
const DEVICE_ID_KEY = 'pd_kids_device_id_v5'; // Incrementei versão para forçar regeneração

export const generateDeviceId = (): string => {
  // 🔧 USAR sessionStorage para verificar se já existe uma sessão ativa neste dispositivo
  const existingDeviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  // Se já existe uma sessão ativa em outra aba, usar o mesmo device ID
  if (existingDeviceId) {
    console.log('📱 Usando Device ID existente:', existingDeviceId.substring(0, 30) + '...');
    return existingDeviceId;
  }

  // 🔧 GERAR FINGERPRINT ÚNICO DO DISPOSITIVO FÍSICO (mais robusto)
  const generateDeviceFingerprint = (): string => {
    // Canvas fingerprint (específico do hardware gráfico)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let canvasFingerprint = '';
    
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('PD Kids Device 2024', 2, 2);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillRect(100, 5, 62, 20);
      canvasFingerprint = canvas.toDataURL().slice(-50); // Últimos 50 chars
    }

    // Características FÍSICAS do dispositivo
    const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}x${window.screen.pixelDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.languages ? navigator.languages.join(',') : navigator.language;
    const platform = navigator.platform;
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;
    const deviceMemory = (navigator as any).deviceMemory || 0;
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    // WebGL fingerprint (específico do hardware gráfico)
    const webglRenderer = (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl2') ||
                    canvas.getContext('webgl') ||
                    canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (!gl) return 'unknown';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
        return `${vendor}-${renderer}`.slice(0, 50);
      } catch (e) {
        return 'unknown';
      }
    })();

    // Audio fingerprint (específico do hardware de áudio)
    const audioFingerprint = (() => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        return `${audioContext.sampleRate}-${audioContext.destination.maxChannelCount}-${analyser.fftSize}`;
      } catch (e) {
        return 'unknown';
      }
    })();

    // Fonts disponíveis (específico do sistema)
    const fontFingerprint = (() => {
      const testFonts = ['Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'];
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return 'unknown';
      
      context.textBaseline = 'top';
      context.font = testSize + ' monospace';
      const baselineSize = context.measureText(testString).width;
      
      return testFonts.filter(font => {
        context.font = testSize + ' ' + font + ', monospace';
        return context.measureText(testString).width !== baselineSize;
      }).join(',').slice(0, 30);
    })();

    // Combinar TODAS as características FÍSICAS do dispositivo
    const deviceString = [
      canvasFingerprint,
      screen,
      timezone,
      language,
      platform,
      hardwareConcurrency,
      deviceMemory,
      maxTouchPoints,
      webglRenderer,
      audioFingerprint,
      fontFingerprint,
      navigator.userAgent.slice(0, 100)
    ].join('|');

    // Criar hash mais robusto usando múltiplos algoritmos
    let hash1 = 0;
    for (let i = 0; i < deviceString.length; i++) {
      const char = deviceString.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1) + char;
      hash1 = hash1 & hash1;
    }

    let hash2 = 5381;
    for (let i = 0; i < deviceString.length; i++) {
      hash2 = ((hash2 << 5) + hash2) + deviceString.charCodeAt(i);
    }

    let hash3 = 0;
    for (let i = 0; i < deviceString.length; i++) {
      hash3 = deviceString.charCodeAt(i) + ((hash3 << 5) - hash3);
    }

    return `hw_${Math.abs(hash1).toString(36)}_${Math.abs(hash2).toString(36)}_${Math.abs(hash3).toString(36)}`;
  };

  // 🔧 CRIAR DEVICE ID ÚNICO BASEADO APENAS NO HARDWARE FÍSICO
  const deviceFingerprint = generateDeviceFingerprint();
  const uniqueDeviceId = `${deviceFingerprint}`;
  
  // 🔧 SALVAR NO LOCALSTORAGE para persistir entre abas e sessões
  localStorage.setItem(DEVICE_ID_KEY, uniqueDeviceId);
  
  console.log('📱 Novo Device ID físico gerado:', {
    fingerprint: deviceFingerprint.substring(0, 30) + '...',
    finalId: uniqueDeviceId.substring(0, 40) + '...'
  });
  
  return uniqueDeviceId;
};

export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let deviceType = 'Desktop';
  let deviceName = 'Computador';
  let osInfo = '';

  // Detectar sistema operacional e tipo de dispositivo
  if (/Android/i.test(userAgent)) {
    deviceType = 'Android';
    const androidMatch = userAgent.match(/Android\s([0-9\.]*)/);
    osInfo = androidMatch ? ` ${androidMatch[1]}` : '';
    deviceName = `Android${osInfo}`;
  } else if (/iPhone/i.test(userAgent)) {
    deviceType = 'iOS';
    const iosMatch = userAgent.match(/OS\s([0-9_]*)/);
    osInfo = iosMatch ? ` ${iosMatch[1].replace(/_/g, '.')}` : '';
    deviceName = `iPhone${osInfo}`;
  } else if (/iPad/i.test(userAgent)) {
    deviceType = 'iOS';
    const iosMatch = userAgent.match(/OS\s([0-9_]*)/);
    osInfo = iosMatch ? ` ${iosMatch[1].replace(/_/g, '.')}` : '';
    deviceName = `iPad${osInfo}`;
  } else if (/Windows NT/i.test(userAgent)) {
    deviceType = 'Windows';
    const winMatch = userAgent.match(/Windows NT\s([0-9\.]*)/);
    osInfo = winMatch ? ` ${winMatch[1]}` : '';
    deviceName = `Windows${osInfo}`;
  } else if (/Mac OS X/i.test(userAgent)) {
    deviceType = 'Mac';
    const macMatch = userAgent.match(/Mac OS X\s([0-9_]*)/);
    osInfo = macMatch ? ` ${macMatch[1].replace(/_/g, '.')}` : '';
    deviceName = `macOS${osInfo}`;
  } else if (/Linux/i.test(userAgent)) {
    deviceType = 'Linux';
    deviceName = 'Linux';
  }

  // Detectar navegador
  let browser = '';
  if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/Edge/i.test(userAgent)) {
    browser = 'Edge';
  } else {
    browser = 'Outro';
  }

  // 🔧 DETECTAR MODO ANÔNIMO/PRIVADO
  const isPrivateMode = (() => {
    try {
      // Teste para Chrome/Edge
      if (window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect) {
        return false; // Modo normal
      }
      
      // Teste para Firefox
      if (typeof InstallTrigger !== 'undefined') {
        return false; // Modo normal
      }
      
      // Teste para Safari
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return false; // Modo normal
      } catch (e) {
        return true; // Modo privado
      }
    } catch (e) {
      return true; // Assumir modo privado em caso de erro
    }
  })();

  // Adicionar informações mais específicas do dispositivo
  const screenInfo = `${window.screen.width}x${window.screen.height}`;

  // 🔧 NOME SIMPLES DO DISPOSITIVO FÍSICO (sem aba/sessão)
  const privateSuffix = isPrivateMode ? ' (Privado)' : '';
  const finalDeviceName = `${deviceName} (${browser})${privateSuffix}`;

  return {
    type: deviceType,
    name: finalDeviceName,
    browser,
    os: deviceType,
    screen: screenInfo,
    userAgent: userAgent.substring(0, 100), // Primeiros 100 caracteres para identificação
    isPrivateMode
  };
};

/* 🆕 NOVА ФУНКЦИЯ: Heartbeat para manter sessão ativa */
export const sendHeartbeat = async () => {
  try {
    const sessionToken = getCurrentSessionToken();
    if (!sessionToken) return;

    await apiRequest('/devices.php?action=heartbeat', {
      method: 'POST',
      body: JSON.stringify({ session_token: sessionToken }),
    });
  } catch (error) {
    console.error('❌ Erro no heartbeat:', error);
  }
};

/* Função adicional para atualizar nome do dispositivo */
export const updateDeviceName = async (userId: string, deviceId: string, newName: string) => {
  try {
    console.log('🔄 Atualizando nome do dispositivo:', { userId, deviceId, newName });

    const response = await fetch(`${API_BASE_URL}/devices.php?action=update-name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        device_id: deviceId,
        name: newName,
      }),
    });

    console.log('📡 Status da resposta:', response.status);

    const text = await response.text();
    console.log(' 📄 Resposta recebida:', text);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = JSON.parse(text);
    console.log('✅ JSON parseado com sucesso:', result);

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Erro ao atualizar nome do dispositivo:', error);
    throw error;
  }
};

/* Funções de envio de e‑mail */
export const sendNotificationEmail = async (data: {
  type: 'user_created' | 'user_updated' | 'renewal' | 'purchase';
  userName: string;
  userEmail: string;
  userCpf: string;
  planName?: string;
  planDevices?: string;
  accessDays?: string;
  changes?: {
    email?: boolean;
    cpf?: boolean;
  };
  whatsapp?: string;
  planDetails?: any;
}) => {
  try {
    const result = await apiRequest('/send-email.php', {
      method: 'POST',
      body: JSON.stringify({
        type: data.type,
        to_email: 'contato@profetadedeus.com.br',
        userName: data.userName,
        userEmail: data.userEmail,
        userCpf: data.userCpf,
        planName: data.planName,
        planDevices: data.planDevices,
        accessDays: data.accessDays,
        changes: data.changes,
        whatsapp: data.whatsapp,
        planDetails: data.planDetails,
      }),
    });
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
};
