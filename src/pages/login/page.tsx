import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loginUser,
  registerDevice,
  getUserDevices,
} from '../../lib/database';
import Button from '../../components/base/Button';
  import Input from '../../components/base/Input';
import Card from '../../components/base/Card';
import WhatsAppButton from '../../components/feature/WhatsAppButton';
import { useToastContext } from '../../contexts/ToastContext';

interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  lastAccess: string;
  ip: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // CPF
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [supportsBiometric, setSupportsBiometric] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showDeviceManager, setShowDeviceManager] = useState(false);
  const [registeredDevices, setRegisteredDevices] = useState<DeviceInfo[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ✅ Novo: toggle do olho
  const [showCPF, setShowCPF] = useState(false);

  const navigate = useNavigate();
  const toast = useToastContext();

  /* -------------------------------------------------------------------------- */
  /*                               Effect – Init                               */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
          userAgent
        ) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    checkAutoLogin();

    if (isMobile) {
      checkBiometricSupport();
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      checkBiometricSupport();
    }
  }, [isMobile]);

  /* -------------------------------------------------------------------------- */
  /*                           Auto-login & Helpers                            */
  /* -------------------------------------------------------------------------- */
  const checkAutoLogin = async () => {
    try {
      const savedIP = localStorage.getItem('trusted_ip');
      const deviceId = getDeviceId();
      const currentIP = await getCurrentIP();

      if (savedIP && savedIP === currentIP) {
        const userData = localStorage.getItem('user');
        const deviceData = localStorage.getItem('registered_devices');

        if (userData && deviceData) {
          const devices: DeviceInfo[] = JSON.parse(deviceData);
          const isDeviceRegistered = devices.some(
            (device) => device.id === deviceId
          );

          if (isDeviceRegistered) {
            navigate('/inicio');
            return;
          }
        }
      }

      const savedEmail = localStorage.getItem('remembered_email');
      const savedPassword = localStorage.getItem('remembered_password');

      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Erro no auto-login:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('trusted_ip');
      localStorage.removeItem('registered_devices');
    }
  };

  const getCurrentIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Erro ao obter IP:', error);
      return null;
    }
  };

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId =
        'device_' +
        Math.random().toString(36).substr(2, 9) +
        '_' +
        Date.now();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let deviceType = 'Desktop';
    let deviceName = 'Computador';

    if (/android/i.test(userAgent)) {
      deviceType = 'Android';
      deviceName = 'Dispositivo Android';
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
      deviceType = 'iOS';
      deviceName = /iPad/.test(userAgent) ? 'iPad' : 'iPhone';
    } else if (/Windows/.test(userAgent)) {
      deviceType = 'Windows';
      deviceName = 'PC Windows';
    } else if (/Mac/.test(userAgent)) {
      deviceType = 'Mac';
      deviceName = 'Mac';
    } else if (/Linux/.test(userAgent)) {
      deviceType = 'Linux';
      deviceName = 'PC Linux';
    }

    return { type: deviceType, name: deviceName };
  };

  const checkBiometricSupport = () => {
    if ('credentials' in navigator && 'create' in navigator.credentials) {
      setSupportsBiometric(true);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              Form submit logic                              */
  /* -------------------------------------------------------------------------- */
  const digitsOnly = (v: string) => v.replace(/\D+/g, '').slice(0, 11);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          toast.error('Campos obrigatórios', 'Por favor, preencha todos os campos');
          setLoading(false);
          return;
        }

        // ✅ Enviar ao backend apenas dígitos do CPF
        const cpfDigits = digitsOnly(password);

        console.log('🔍 Tentando login com:', { email, password: cpfDigits.substring(0, 3) + '***' });
        
        const { data: user, error } = await loginUser(email, cpfDigits);

        if (error) {
          console.log('❌ Erro no login:', error);
          toast.error('Erro no login', error);
          setLoading(false);
          return;
        }

        if (!user) {
          console.log('❌ Usuário não retornado pela API');
          toast.error('Usuário não encontrado', 'Verifique suas credenciais ou cadastre-se');
          setLoading(false);
          return;
        }

        console.log('✅ Login bem-sucedido:', user.name);

        // Buscar dispositivos do banco de dados
        const { data: devices } = await getUserDevices(user.id);
        const deviceId = getDeviceId();
        const currentDevices = devices || [];

        const isDeviceRegistered = currentDevices.some(
          (d: any) => d.device_id === deviceId && d.is_active
        );

        // Se já está registrado, segue para /inicio
        if (isDeviceRegistered) {
          localStorage.setItem('user', JSON.stringify(user));
          
          if (rememberMe) {
            localStorage.setItem('remembered_email', email);
            localStorage.setItem('remembered_password', cpfDigits);
            if (supportsBiometric && isMobile) {
              localStorage.setItem('biometric_user', JSON.stringify(user));
            }
          } else {
            localStorage.removeItem('remembered_email');
            localStorage.removeItem('remembered_password');
          }

          const currentIP = await getCurrentIP();
          if (currentIP) {
            localStorage.setItem('trusted_ip', currentIP);
          }

          navigate('/inicio');
          return;
        }

        // Verificar limite de dispositivos (admin tem 99)
        const maxDevices = user.is_admin ? 99 : user.license_count;

        if (!isDeviceRegistered && currentDevices.length >= maxDevices) {
          setCurrentUser(user);
          setRegisteredDevices(
            currentDevices.map((d: any) => ({
              id: d.device_id,
              name: d.name,
              type: d.type,
              lastAccess: d.last_access,
              ip: d.ip,
            }))
          );
          setShowDeviceManager(true);
          setLoading(false);
          return;
        }

        // Registrar dispositivo atual se não estiver registrado
        if (!isDeviceRegistered) {
          const deviceInfo = getDeviceInfo();
          await registerDevice({
            user_id: user.id,
            device_id: deviceId,
            name: deviceInfo.name,
            type: deviceInfo.type,
            last_access: new Date().toISOString(),
            ip: (await getCurrentIP()) ?? 'Desconhecido',
            is_active: true,
          });
        }

        localStorage.setItem('user', JSON.stringify(user));

        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
          localStorage.setItem('remembered_password', cpfDigits);
          if (supportsBiometric && isMobile) {
            localStorage.setItem('biometric_user', JSON.stringify(user));
          }
        } else {
          localStorage.removeItem('remembered_email');
          localStorage.removeItem('remembered_password');
        }

        const currentIP = await getCurrentIP();
        if (currentIP) {
          localStorage.setItem('trusted_ip', currentIP);
        }

        toast.success('Login realizado!', `Bem-vindo, ${user.name}!`);
        navigate('/inicio');
      } else {
        // Redirecionar para página de compra de licença
        navigate('/comprar-licenca');
      }
    } catch (error) {
      console.error('Erro no login/cadastro:', error);
      toast.error('Erro no sistema', 'Tente novamente em alguns instantes');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                         Device manager – removal logic                      */
  /* -------------------------------------------------------------------------- */
  const handleRemoveDevice = async (deviceId: string) => {
    if (!currentUser) return;

    try {
      // Remover do banco de dados
      const { removeDevice } = await import('../../lib/database');
      const { error } = await removeDevice(currentUser.id, deviceId);

      if (error) {
        toast.error('Erro', 'Não foi possível remover o dispositivo');
        return;
      }

      // Atualizar lista local
      const updatedDevices = registeredDevices.filter(
        (device) => device.id !== deviceId
      );
      setRegisteredDevices(updatedDevices);

      toast.success('Dispositivo removido', 'Sessão encerrada com sucesso');

      // Se liberou espaço, tentar fazer login novamente
      const maxDevices = currentUser.is_admin ? 99 : currentUser.license_count;
      if (updatedDevices.length < maxDevices) {
        // Registrar o dispositivo atual
        const deviceInfo = getDeviceInfo();
        const currentDeviceId = getDeviceId();

        const { registerDevice } = await import('../../lib/database');
        await registerDevice({
          user_id: currentUser.id,
          device_id: currentDeviceId,
          name: deviceInfo.name,
          type: deviceInfo.type,
          last_access: new Date().toISOString(),
          ip: (await getCurrentIP()) ?? 'Desconhecido',
          is_active: true,
        });

        // Salvar dados do usuário e fazer login
        localStorage.setItem('user', JSON.stringify(currentUser));

        const currentIP = await getCurrentIP();
        if (currentIP) {
          localStorage.setItem('trusted_ip', currentIP);
        }

        toast.success('Login realizado!', `Bem-vindo, ${currentUser.name}!`);
        setShowDeviceManager(false);
        navigate('/inicio');
      }
    } catch (error) {
      console.error('Erro ao remover dispositivo:', error);
      toast.error('Erro', 'Não foi possível remover o dispositivo');
    }
  };

  const handleUpgradePlan = () => {
    if (!currentUser) return;

    const currentPlan = currentUser.license_count === 1 ? 'Básico' : 
                       currentUser.license_count === 3 ? 'PRO' : 
                       currentUser.license_count === 5 ? 'Premium' : 'Personalizado';

    const message = `Olá! Gostaria de fazer upgrade do meu plano.\n\n📋 *DADOS DO CADASTRO:*\n• Nome: ${currentUser.name}\n• Email: ${currentUser.email}\n• Plano Atual: ${currentPlan} (${currentUser.license_count} dispositivos)\n\n🚀 *SOLICITAÇÃO:*\nGostaria de fazer upgrade para o Plano Premium (5 dispositivos) - RECOMENDADO!\n\nPor favor, me informe as opções disponíveis e valores.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    toast.info('Redirecionando...', 'Você será direcionado para o WhatsApp');
  };

  /* -------------------------------------------------------------------------- */
  /*                                   UI helpers                               */
  /* -------------------------------------------------------------------------- */
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'Android':
        return 'ri-android-line';
      case 'iOS':
        return 'ri-apple-line';
      case 'Windows':
        return 'ri-windows-line';
      case 'Mac':
        return 'ri-apple-line';
      case 'Linux':
        return 'ri-ubuntu-line';
      default:
        return 'ri-computer-line';
    }
  };

  const getUpgradeOptions = () => {
    if (!currentUser) return [];

    if (currentUser.license_count === 1) {
      return [
        { name: 'Premium', devices: 5, description: 'Básico → Premium (1 → 5 dispositivos) - RECOMENDADO', recommended: true },
        { name: 'PRO', devices: 3, description: 'Básico → PRO (1 → 3 dispositivos)', recommended: false }
      ];
    } else if (currentUser.license_count === 3) {
      return [
        { name: 'Premium', devices: 5, description: 'PRO → Premium (3 → 5 dispositivos) - RECOMENDADO', recommended: true }
      ];
    }
    return [];
  };

  /* -------------------------------------------------------------------------- */
  /*                                 Render UI                                   */
  /* -------------------------------------------------------------------------- */
  if (showDeviceManager && currentUser) {
    const upgradeOptions = getUpgradeOptions();
    const maxDevices = currentUser.is_admin ? 99 : currentUser.license_count;

    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #3b82f6 0%, #f97316 20%, #ef4444 40%, #8b5cf6 60%, #ec4899 80%, #3b82f6 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 25s ease infinite',
        }}
      >
        <div className="w-full max-w-2xl mx-4 relative z-10">
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-red-200/50 shadow-2xl">
            <div className="text-center mb-6">
              <i className="ri-error-warning-line text-6xl text-red-500 mb-4"></i>
              <h2 className="text-2xl font-bold text-red-700 mb-2">
                Limite de Dispositivos Atingido
              </h2>
              <p className="text-gray-600 mb-4">
                Você já tem {registeredDevices.length} dispositivo(s) registrado(s) de{' '}
                {maxDevices} permitido(s). Para acessar neste dispositivo, remova
                um dos dispositivos abaixo{upgradeOptions.length > 0 ? ' ou faça upgrade do seu plano' : ''}:
              </p>

              {/* Opções de Upgrade */}
              {upgradeOptions.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-blue-700 mb-3">
                    🚀 Opções de Upgrade Disponíveis
                  </h3>
                  <div className="space-y-2">
                    {upgradeOptions.map((option, index) => (
                      <Button
                        key={index}
                        onClick={handleUpgradePlan}
                        className={`w-full font-bold px-4 py-3 whitespace-nowrap ${
                          option.recommended 
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                        }`}
                      >
                        <i className="ri-vip-crown-line mr-2"></i>
                        {option.description}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensagem para Premium */}
              {currentUser.license_count === 5 && !currentUser.is_admin && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <h3 className="text-lg font-bold text-green-700 mb-2">
                    🏆 Plano Premium Ativo
                  </h3>
                  <p className="text-sm text-gray-600">
                    Você já possui o plano Premium com limite máximo de 5 dispositivos simultâneos.
                  </p>
                </div>
              )}
            </div>

            {/* Texto explicativo */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700 text-center">
                <i className="ri-information-line mr-2 text-blue-500"></i>
                Abaixo estão todos os dispositivos logados usando seu cadastro. Caso queira desconectar algum para liberar acessos, clique em <strong>ENCERRAR SESSÃO</strong>.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {registeredDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <i className={`${getDeviceIcon(device.type)} text-2xl text-gray-600`}></i>
                    <div>
                      <p className="font-semibold text-gray-800">{device.name}</p>
                      <p className="text-sm text-gray-600">
                        {device.type} • IP: {device.ip}
                      </p>
                      <p className="text-xs text-gray-500">
                        Último acesso: {new Date(device.lastAccess).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveDevice(device.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm whitespace-nowrap"
                  >
                    <i className="ri-delete-bin-line mr-1"></i>
                    Encerrar Sessão
                  </Button>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={() => setShowDeviceManager(false)}
                variant="secondary"
                className="mr-4 whitespace-nowrap"
              >
                Cancelar
              </Button>
              {upgradeOptions.length > 0 && (
                <p className="text-sm text-gray-600 mt-4">
                  Precisa de mais dispositivos? Entre em contato via WhatsApp!
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-8 pb-32"
      style={{
        background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 25%, #f8b500 50%, #40407a 75%, #706fd3 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 25s ease infinite',
      }}
    >
      {/* Elementos decorativos animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Círculos flutuantes */}
        <div
          className="absolute top-20 left-20 w-16 h-16 bg-yellow-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '0s', animationDuration: '3s' }}
        ></div>
        <div
          className="absolute top-40 right-32 w-12 h-12 bg-pink-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '1s', animationDuration: '4s' }}
        ></div>
        <div
          className="absolute bottom-32 left-40 w-20 h-20 bg-blue-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '2s', animationDuration: '5s' }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-10 h-10 bg-green-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}
        ></div>
        <div
          className="absolute top-60 left-32 w-8 h-8 bg-purple-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}
        ></div>
        <div
          className="absolute top-32 right-1/4 w-14 h-14 bg-orange-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '2.5s', animationDuration: '3.8s' }}
        ></div>

        {/* Estrelas piscando */}
        <div className="absolute top-24 left-1/4 text-yellow-300/70 text-2xl animate-pulse" style={{ animationDuration: '2s' }}>
          ⭐
        </div>
        <div className="absolute top-48 right-1/3 text-yellow-300/70 text-xl animate-pulse" style={{ animationDuration: '3s' }}>
          ✨
        </div>
        <div className="absolute bottom-60 left-1/2 text-yellow-300/70 text-3xl animate-pulse" style={{ animationDuration: '2.5s' }}>
          🌟
        </div>
        <div className="absolute top-72 left-24 text-yellow-300/70 text-lg animate-pulse" style={{ animationDuration: '4s' }}>
          💫
        </div>
        <div className="absolute bottom-40 right-1/3 text-yellow-300/70 text-2xl animate-pulse" style={{ animationDuration: '3.5s' }}>
          ⭐
        </div>
        <div className="absolute top-1/2 right-16 text-yellow-300/70 text-xl animate-pulse" style={{ animationDuration: '2.8s' }}>
          ✨
        </div>
      </div>

      <div className="w-full max-w-md mx-4 relative z-10">
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 overflow-hidden">
          {/* Header com logo */}
          <div className="text-center py-6 px-6">
            <img 
              src="https://static.readdy.ai/image/90aee2f41c3492197bc6a5939c00cef4/41af0e5a6d49213fb975fa0447bec3cd.png" 
              alt="Profeta de Deus Kids" 
              className="h-16 mx-auto mb-4 object-contain"
            />
            <h2 className="text-lg text-gray-600 font-medium">
              {isLogin ? 'Entre na sua conta' : 'Criar nova conta'}
            </h2>
          </div>

          {/* Formulário */}
          <div className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-700 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400 transition-all"
              />

              {/* ✅ Campo CPF com olho e só números */}
              <div className="relative">
                <Input
                  type={showCPF ? 'text' : 'password'}
                  inputMode="numeric"
                  placeholder={isLogin ? "Digite seu CPF" : "Digite seu CPF (será sua senha)"}
                  value={password}
                  onChange={(e) => setPassword(digitsOnly(e.target.value))}
                  onKeyDown={(e) => {
                    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
                    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
                  }}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-700 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCPF(v => !v)}
                  aria-label={showCPF ? 'Ocultar CPF' : 'Mostrar CPF'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <i className={showCPF ? 'ri-eye-off-line text-xl' : 'ri-eye-line text-xl'}></i>
                </button>
              </div>

              {/* Checkbox Lembrar de mim - apenas no login */}
              {isLogin && (
                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-600">
                    Lembrar de mim neste dispositivo
                  </label>
                </div>
              )}

              {/* Botão principal */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl border-0 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 whitespace-nowrap"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Entrando...' : 'Criando conta...'}
                  </div>
                ) : (
                  isLogin ? 'Entrar' : 'Criar Conta'
                )}
              </Button>

              {/* Botão Como Navegar pelo Site */}
              <Button
                type="button"
                onClick={() => navigate('/como-navegar')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl border-0 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 whitespace-nowrap"
              >
                <i className="ri-play-circle-line mr-2"></i>
                Como Navegar pelo Site
              </Button>

              {/* Toggle entre Login e Cadastro */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    if (isLogin) {
                      // Se está no modo login e clica em "Criar Conta", vai para comprar licença
                      navigate('/comprar-licenca');
                    } else {
                      // Se está no modo cadastro e clica em "Fazer Login", volta para login
                      setIsLogin(true);
                    }
                  }}
                  variant="secondary"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-all whitespace-nowrap"
                >
                  {isLogin ? 'Criar Conta' : 'Fazer Login'}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* WhatsApp Button */}
        <WhatsAppButton message="Olá! Preciso de ajuda com o login no Profeta de Deus Kids" />

        <div className="text-center mt-6">
          <p className="text-white/80 text-sm drop-shadow">
            Acesso seguro com controle de dispositivos por licença
          </p>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          25% { background-position: 25% 50%; }
          50% { background-position: 50% 50%; }
          75% { background-position: 75% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}