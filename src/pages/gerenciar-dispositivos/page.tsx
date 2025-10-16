import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { useToastContext } from '../../contexts/ToastContext';
import {
  getUserDevices,
  removeDevice,
  updateDeviceName,
  generateDeviceId
} from '../../lib/database';

interface Device {
  id: string;
  user_id: string;
  device_id: string;
  name: string;
  type: string;
  last_access: string;
  ip: string;
  is_active: boolean;
  session_token?: string;
}

export default function GerenciarDispositivosPage() {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [user, setUser] = useState<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Obter ID do dispositivo atual
      const deviceId = generateDeviceId();
      setCurrentDeviceId(deviceId);
      
      loadDevices(parsedUser.id);
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err);
      navigate('/login');
    }
  }, [navigate]);

  const loadDevices = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error: devicesError } = await getUserDevices(userId);
      
      if (devicesError) {
        error('Erro', 'Não foi possível carregar os dispositivos');
        return;
      }

      // Filtrar únicos por device_id (mantendo o mais recente)
      const uniqueDevices = data?.reduce((acc: Device[], device: Device) => {
        const existingIndex = acc.findIndex(d => d.device_id === device.device_id);
        if (existingIndex === -1) {
          acc.push(device);
        } else {
          const existing = acc[existingIndex];
          if (new Date(device.last_access) > new Date(existing.last_access)) {
            acc[existingIndex] = device;
          }
        }
        return acc;
      }, []) || [];

      console.log('📱 Dispositivos únicos carregados:', uniqueDevices.length);
      setDevices(uniqueDevices);
    } catch (err) {
      console.error('Erro ao carregar dispositivos:', err);
      error('Erro', 'Falha ao carregar dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string, deviceName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o dispositivo "${deviceName}"?\n\nEsta ação irá desconectar o dispositivo imediatamente.`)) {
      return;
    }

    try {
      const { error: removeError } = await removeDevice(user.id, deviceId);
      if (removeError) {
        error('Erro', 'Não foi possível remover o dispositivo');
        return;
      }

      success('Sucesso', 'Dispositivo removido com sucesso');
      
      if (deviceId === currentDeviceId) {
        setTimeout(() => {
          localStorage.clear();
          navigate('/login');
        }, 1000);
        return;
      }
      
      loadDevices(user.id);
    } catch (err) {
      console.error('Erro ao remover dispositivo:', err);
      error('Erro', 'Falha ao remover dispositivo');
    }
  };

  const handleUpdateDeviceName = async (deviceId: string) => {
    if (!newDeviceName.trim()) {
      error('Erro', 'Nome do dispositivo não pode estar vazio');
      return;
    }

    try {
      await updateDeviceName(user.id, deviceId, newDeviceName.trim());
      success('Sucesso', 'Nome do dispositivo atualizado');
      setEditingDevice(null);
      setNewDeviceName('');
      loadDevices(user.id);
    } catch (err) {
      console.error('Erro ao atualizar nome do dispositivo:', err);
      error('Erro', 'Falha ao atualizar nome do dispositivo');
    }
  };

  const startEditing = (device: Device) => {
    setEditingDevice(device.device_id);
    setNewDeviceName(device.name);
  };

  const cancelEditing = () => {
    setEditingDevice(null);
    setNewDeviceName('');
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'android': return 'ri-android-line';
      case 'ios': return 'ri-apple-line';
      case 'windows': return 'ri-windows-line';
      case 'mac': return 'ri-apple-line';
      case 'linux': return 'ri-ubuntu-line';
      default: return 'ri-computer-line';
    }
  };

  const formatLastAccess = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} dia${days > 1 ? 's' : ''} atrás`;
  };

  const getPlanName = (licenseCount: number) => {
    switch (licenseCount) {
      case 1: return 'BÁSICO';
      case 3: return 'PRO';
      case 5: return 'PREMIUM';
      default: return 'BÁSICO';
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dispositivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gerenciar Dispositivos</h1>
          <p className="text-gray-600">
            Gerencie os dispositivos conectados à sua conta
          </p>
        </div>

        {/* Informações do plano */}
        <Card className="mb-8 p-6 bg-white/80 backdrop-blur-sm border border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Plano {getPlanName(user.license_count)}</h2>
              <p className="text-gray-600">
                Você pode usar até {user.license_count} dispositivo{user.license_count > 1 ? 's' : ''} simultaneamente
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {devices.length} / {user.license_count}
              </div>
              <div className="text-sm text-gray-500">Dispositivos únicos</div>
            </div>
          </div>
        </Card>

        {/* Lista de dispositivos */}
        <div className="space-y-4">
          {devices.length === 0 ? (
            <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border border-white/20">
              <i className="ri-smartphone-line text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum dispositivo conectado</h3>
              <p className="text-gray-600">
                Faça login em um dispositivo para vê-lo aparecer aqui
              </p>
            </Card>
          ) : (
            devices.map((device) => (
              <Card key={device.id} className="p-6 bg-white/80 backdrop-blur-sm border border-white/20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Informações do dispositivo */}
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className={`${getDeviceIcon(device.type)} text-2xl text-blue-600`}></i>
                    </div>
                    
                    <div className="flex-1">
                      {editingDevice === device.device_id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nome do dispositivo"
                          />
                          <Button
                            onClick={() => handleUpdateDeviceName(device.device_id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2"
                          >
                            <i className="ri-check-line mr-1"></i>
                            Salvar
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2"
                          >
                            <i className="ri-close-line mr-1"></i>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-800">{device.name}</h3>
                            {device.device_id === currentDeviceId && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                Este dispositivo
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {device.type} • IP: {device.ip}
                          </p>
                          <p className="text-sm text-gray-500">
                            Último acesso: {formatLastAccess(device.last_access)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  {editingDevice !== device.device_id && (
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => startEditing(device)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2"
                        title="Renomear dispositivo"
                      >
                        <i className="ri-edit-line mr-1"></i>
                        {/* ✅ Texto visível restaurado */}
                        Renomear
                      </Button>
                      
                      <Button
                        onClick={() => handleRemoveDevice(device.device_id, device.name)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2"
                        title="Remover dispositivo"
                      >
                        <i className="ri-delete-bin-line mr-1"></i>
                        {/* ✅ Texto visível restaurado */}
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Informações adicionais */}
        <Card className="mt-8 p-6 bg-blue-50/80 backdrop-blur-sm border border-blue-200">
          <h3 className="text-lg font-bold text-blue-800 mb-3">
            <i className="ri-information-line mr-2"></i>
            Informações importantes
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Cada dispositivo físico aparece apenas uma vez na lista</p>
            <p>• Você pode renomear seus dispositivos para identificá-los melhor</p>
            <p>• Ao remover um dispositivo, ele será desconectado imediatamente</p>
            <p>• Se você remover o dispositivo atual, será deslogado automaticamente</p>
            <p>• Para usar mais dispositivos simultaneamente, faça upgrade do seu plano</p>
          </div>
        </Card>

        {/* Botão voltar */}
        <div className="text-center mt-8">
          <Button
            onClick={() => navigate('/inicio')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold px-6 py-3"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
}