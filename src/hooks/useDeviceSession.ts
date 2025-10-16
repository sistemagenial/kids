
import { useEffect } from 'react';
import { 
  registerDevice, 
  checkDeviceLimit, 
  generateDeviceId, 
  getDeviceInfo,
  setSessionToken,
  getCurrentSessionToken,
  sendHeartbeat
} from '../lib/database';

export const useDeviceSession = (user: any) => {
  useEffect(() => {
    if (!user || user.is_admin) return;

    const initializeDeviceSession = async () => {
      try {
        // 🔧 VERIFICAÇÃO CRÍTICA: Checar se já existe sessão ativa neste dispositivo
        const deviceId = generateDeviceId();
        const existingSession = sessionStorage.getItem('pd_active_session');
        
        console.log('🔍 Verificando sessão existente:', {
          deviceId: deviceId.substring(0, 30) + '...',
          existingSession: existingSession ? 'SIM' : 'NÃO'
        });

        // 🔧 VERIFICAR SE JÁ EXISTE ACESSO ATIVO PARA ESTE DISPOSITIVO FÍSICO
        const { data: limitCheck } = await checkDeviceLimit(user.id, deviceId);
        
        console.log('🔍 Resultado da verificação de limite:', limitCheck);

        if (!limitCheck?.can_access) {
          // 🔧 BLOQUEAR ACESSO - Dispositivo já está sendo usado
          alert(`❌ ACESSO BLOQUEADO!\n\nEste dispositivo já está sendo usado em outra aba/janela.\n\nVocê tem ${limitCheck?.active_devices} de ${limitCheck?.max_devices} dispositivos ativos.\n\nFeche outras abas/janelas deste dispositivo ou remova um dispositivo em "Gerenciar Dispositivos".`);
          
          // Limpar dados locais e redirecionar
          localStorage.removeItem('user');
          sessionStorage.clear();
          window.location.href = '/login';
          return;
        }
        
        // 🔧 MARCAR ESTA ABA COMO SESSÃO ATIVA
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('pd_active_session', sessionId);
        
        const deviceInfo = getDeviceInfo();
        
        // Função simples para obter IP (mantido para logs)
        const getUserIP = async () => {
          try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
          } catch (error) {
            console.error('Erro ao obter IP:', error);
            return 'unknown';
          }
        };
        
        const ip = await getUserIP();
        
        // Gerar token de sessão único para esta aba específica
        const sessionToken = `session_${sessionId}`;
        setSessionToken(sessionToken);
        
        // 🔧 REGISTRAR dispositivo físico com session ID único
        const { data: device } = await registerDevice({
          user_id: user.id,
          device_id: deviceId, // Mesmo ID para o dispositivo físico
          name: `${deviceInfo.name} [${sessionId.slice(-8)}]`, // Identificador da aba
          type: deviceInfo.type,
          ip: ip,
          last_access: new Date().toISOString(),
          is_active: true,
          session_token: sessionToken, // Token único por aba para controle
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          screen: deviceInfo.screen,
          userAgent: deviceInfo.userAgent
        });
        
        console.log('✅ Dispositivo físico registrado com sucesso:', device);
        
        // 🔧 LISTENER para detectar quando a aba é fechada
        const handleBeforeUnload = () => {
          // Remover sessão ativa quando aba for fechada
          sessionStorage.removeItem('pd_active_session');
        };
        
        const handleVisibilityChange = () => {
          if (document.hidden) {
            // Aba ficou inativa, mas não remove a sessão ainda
            console.log('🔄 Aba ficou inativa');
          } else {
            // Aba ficou ativa novamente
            console.log('🔄 Aba ficou ativa');
          }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Cleanup
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        
      } catch (error) {
        console.error('❌ Erro ao inicializar sessão do dispositivo:', error);
        
        // Em caso de erro, também bloquear acesso
        alert('❌ Erro ao verificar dispositivo. Tente novamente.');
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = '/login';
      }
    };

    initializeDeviceSession();
  }, [user]);

  // 🔧 HEARTBEAT: Manter sessão ativa a cada 3 minutos
  useEffect(() => {
    if (!user || user.is_admin) return;

    const heartbeatInterval = setInterval(() => {
      const activeSession = sessionStorage.getItem('pd_active_session');
      if (activeSession) {
        sendHeartbeat();
      }
    }, 3 * 60 * 1000); // 3 minutos

    return () => clearInterval(heartbeatInterval);
  }, [user]);

  // 🔧 VERIFICAÇÃO DE SESSÃO: A cada 15 segundos
  useEffect(() => {
    if (!user || user.is_admin) return;

    const checkSessionValidity = async () => {
      const sessionToken = getCurrentSessionToken();
      const activeSession = sessionStorage.getItem('pd_active_session');
      
      if (!sessionToken || !activeSession) {
        console.log('⚠️ Sessão inválida, redirecionando para login');
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = '/login';
        return;
      }

      // Verificar se o dispositivo ainda está ativo
      try {
        const { getUserDevices } = await import('../lib/database');
        const { data: devices } = await getUserDevices(user.id);
        const currentDeviceId = generateDeviceId();
        
        const isDeviceActive = devices?.some((d: any) => 
          d.device_id === currentDeviceId && 
          d.is_active &&
          d.session_token === sessionToken
        );
        
        if (!isDeviceActive) {
          console.log('⚠️ Dispositivo não está mais ativo, redirecionando para login');
          localStorage.removeItem('user');
          sessionStorage.clear();
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('❌ Erro ao verificar validade da sessão:', error);
      }
    };

    // Verificar a cada 15 segundos
    const interval = setInterval(checkSessionValidity, 15 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Função para forçar atualização dos dados do usuário
  const refreshUserData = async () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        
        // Buscar dados atualizados do usuário
        const { getUserByEmail } = await import('../lib/database');
        const { data: updatedUser } = await getUserByEmail(user.email);
        
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
          // Disparar evento customizado para atualizar componentes
          window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar dados do usuário:', error);
      }
    }
  };

  // Escutar mudanças nos dados do usuário
  useEffect(() => {
    const handleUserDataUpdate = () => {
      refreshUserData();
    };

    // Verificar mudanças a cada 30 segundos
    const interval = setInterval(() => {
      refreshUserData();
    }, 30000);

    window.addEventListener('userDataUpdated', handleUserDataUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, []);
};
