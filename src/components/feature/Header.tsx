
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../base/Button';

interface HeaderProps {
  user?: any;
  daysRemaining?: number;
  onLogout?: () => void;
  onRenew?: () => Promise<void> | void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function Header({ user, daysRemaining, onLogout, onRenew, showBackButton, onBack }: HeaderProps) {
  // Evita erro de variável não utilizada (TypeScript TS6133)
  void onRenew;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [showDeviceNameModal, setShowDeviceNameModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Carregar nome do dispositivo do localStorage
  useEffect(() => {
    const savedDeviceName = localStorage.getItem('deviceName');
    if (savedDeviceName) {
      setDeviceName(savedDeviceName);
    } else if (user) {
      setDeviceName(user.name);
    }
  }, [user]);

  const handleLogoClick = () => {
    if (user) {
      navigate('/inicio');
    } else {
      navigate('/');
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleSaveDeviceName = () => {
    if (newDeviceName.trim()) {
      setDeviceName(newDeviceName.trim());
      localStorage.setItem('deviceName', newDeviceName.trim());
      setShowDeviceNameModal(false);
      setNewDeviceName('');
    }
  };

  const handleUpgradePlan = () => {
    const whatsappNumber = '5517997815756'; // ✅ CORRIGIDO: Número atualizado
    const message = encodeURIComponent('Olá! Gostaria de fazer upgrade do meu plano no Profeta de Deus Kids.');
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Olá! Preciso de ajuda com o Profeta de Deus Kids');
    const whatsappUrl = `https://wa.me/5517997815756?text=${message}`; // ✅ CORRIGIDO: Número atualizado
    window.open(whatsappUrl, '_blank');
  };

  // Função para obter nome do plano baseado no license_count
  const getPlanName = (licenseCount: number): string => {
    switch (licenseCount) {
      case 1:
        return 'BÁSICO';
      case 3:
        return 'PRO';
      case 5:
        return 'PREMIUM';
      default:
        return 'BÁSICO';
    }
  };

  // Verificar se precisa mostrar botão voltar
  const shouldShowBackButton = showBackButton ||
    (location.pathname !== '/' &&
      location.pathname !== '/inicio' &&
      location.pathname !== '/login' &&
      location.pathname !== '/home');

  return (
    <>
      {/* Faixa clara no topo */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          {/* Layout Desktop */}
          <div className="hidden md:flex justify-between items-center gap-2">
            {/* Logo e botão voltar - lado esquerdo */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div
                onClick={handleLogoClick}
                className="cursor-pointer flex-shrink-0"
              >
                <img
                  src="https://static.readdy.ai/image/90aee2f41c3492197bc6a5939c00cef4/41af0e5a6d49213fb975fa0447bec3cd.png"
                  alt="Profeta de Deus Kids"
                  className="h-8 sm:h-10 object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>

              {shouldShowBackButton && (
                <Button
                  onClick={handleBackClick}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-2 py-1 text-xs border border-gray-300 rounded whitespace-nowrap"
                >
                  <i className="ri-arrow-left-line text-sm"></i>
                  <span className="ml-1">VOLTAR</span>
                </Button>
              )}
            </div>

            {/* Lado direito - Botões organizados */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Botão INÍCIO */}
              {user && (
                <Button
                  onClick={() => navigate('/inicio')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-2 py-1 text-xs rounded whitespace-nowrap"
                >
                  <i className="ri-home-line text-sm"></i>
                  <span className="ml-1">INÍCIO</span>
                </Button>
              )}

              {/* Botão FALE CONOSCO - ao lado do INÍCIO */}
              <Button
                onClick={handleWhatsAppClick}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium px-2 py-1 text-xs rounded whitespace-nowrap"
              >
                <i className="ri-whatsapp-line text-sm"></i>
                <span className="ml-1">FALE CONOSCO</span>
              </Button>

              {/* DIAS RESTANTES */}
              {user && daysRemaining !== undefined && !user.is_admin && (
                <div className="text-center px-2">
                  <p className={`text-lg sm:text-xl font-bold ${
                    daysRemaining <= 0 ? 'text-red-600' :
                      daysRemaining <= 30 ? 'text-yellow-600' :
                        'text-green-600'
                  }`}>
                    {daysRemaining <= 0 ? '0' : daysRemaining}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">DIAS RESTANTES</p>
                </div>
              )}

              {/* Botão RENOVAR */}
              {user && daysRemaining !== undefined && !user.is_admin && daysRemaining <= 60 && (
                <Button
                  onClick={() => navigate('/renovar')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-2 py-1 text-xs rounded whitespace-nowrap"
                >
                  <i className="ri-refresh-line text-sm"></i>
                  <span className="ml-1">RENOVAR</span>
                </Button>
              )}

              {/* Menu do usuário */}
              {user && (
                <div className="relative">
                  <Button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="bg-gray-700 hover:bg-gray-800 text-white font-medium px-2 py-1 text-xs rounded whitespace-nowrap"
                  >
                    <i className="ri-user-line text-sm"></i>
                    <span className="truncate text-xs ml-1">{deviceName || user.name}</span>
                    <i className="ri-arrow-down-s-line text-xs ml-1"></i>
                  </Button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {/* Informações do usuário no menu */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-medium text-gray-800">{deviceName || user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {!user.is_admin && (
                          <p className="text-sm text-blue-600 font-medium">
                            Plano {getPlanName(user.license_count)} ({user.license_count} dispositivo{user.license_count > 1 ? 's' : ''})
                          </p>
                        )}
                      </div>

                      {/* Opções do menu */}
                      <button
                        onClick={() => {
                          navigate('/inicio');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="ri-home-line mr-3"></i>
                        Início
                      </button>

                      <button
                        onClick={() => {
                          navigate('/historias');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="ri-book-line mr-3"></i>
                        Histórias
                      </button>

                      <button
                        onClick={() => {
                          navigate('/videos');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="ri-video-line mr-3"></i>
                        Vídeos
                      </button>

                      {/* Renovar - nova opção no menu */}
                      {!user.is_admin && (
                        <button
                          onClick={() => {
                            navigate('/renovar');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-orange-600 hover:bg-orange-50 flex items-center"
                        >
                          <i className="ri-refresh-line mr-3"></i>
                          Renovar
                        </button>
                      )}

                      {/* Upgrade do Plano - apenas se não for admin */}
                      {!user.is_admin && (
                        <button
                          onClick={() => {
                            handleUpgradePlan();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 flex items-center border-t border-gray-200"
                        >
                          <i className="ri-vip-crown-line mr-3"></i>
                          Upgrade do Plano
                        </button>
                      )}

                      {/* Dispositivos Conectados */}
                      <button
                        onClick={() => {
                          navigate('/gerenciar-dispositivos');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="ri-smartphone-line mr-3"></i>
                        Gerenciar Dispositivos
                      </button>

                      {/* Mudar Nome do Dispositivo */}
                      <button
                        onClick={() => {
                          setNewDeviceName(deviceName || user.name);
                          setShowDeviceNameModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="ri-edit-line mr-3"></i>
                        Mudar Nome do Dispositivo
                      </button>

                      {/* Admin */}
                      {user.is_admin && (
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-purple-600 hover:bg-purple-50 flex items-center border-t border-gray-200"
                        >
                          <i className="ri-settings-line mr-3"></i>
                          Painel Admin
                        </button>
                      )}

                      {/* Logout */}
                      <button
                        onClick={() => {
                          if (onLogout) onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center border-t border-gray-200"
                      >
                        <i className="ri-logout-box-line mr-3"></i>
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Layout Mobile */}
          <div className="md:hidden space-y-2">
            {/* Logo centralizada */}
            <div className="flex justify-center items-center">
              <div
                onClick={handleLogoClick}
                className="cursor-pointer"
              >
                <img
                  src="https://static.readdy.ai/image/90aee2f41c3492197bc6a5939c00cef4/41af0e5a6d49213fb975fa0447bec3cd.png"
                  alt="Profeta de Deus Kids"
                  className="h-8 object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Botões INÍCIO e FALE CONOSCO lado a lado */}
            <div className="flex justify-center gap-2">
              {/* Botão INÍCIO */}
              {user && (
                <Button
                  onClick={() => navigate('/inicio')}
                  className="bg-blue-500 hover:bg-blue-6 text-white font-medium px-3 py-2 text-sm rounded whitespace-nowrap"
                >
                  <i className="ri-home-line text-sm"></i>
                  <span className="ml-1">INÍCIO</span>
                </Button>
              )}

              {/* Botão FALE CONOSCO */}
              <Button
                onClick={handleWhatsAppClick}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium px-3 py-2 text-sm rounded whitespace-nowrap"
              >
                <i className="ri-whatsapp-line text-sm"></i>
                <span className="ml-1">FALE CONOSCO</span>
              </Button>
            </div>

            {/* DIAS RESTANTES */}
            {user && daysRemaining !== undefined && !user.is_admin && (
              <div className="flex justify-center">
                <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200">
                  <p className={`text-lg font-bold ${
                    daysRemaining <= 0 ? 'text-red-600' :
                      daysRemaining <= 30 ? 'text-yellow-600' :
                        'text-green-600'
                  }`}>
                    {daysRemaining <= 0 ? '0' : daysRemaining}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">DIAS RESTANTES</p>
                </div>
              </div>
            )}

            {/* Botão RENOVAR */}
            {user && daysRemaining !== undefined && !user.is_admin && daysRemaining <= 60 && (
              <div className="flex justify-center">
                <Button
                  onClick={() => navigate('/renovar')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 text-sm rounded whitespace-nowrap"
                >
                  <i className="ri-refresh-line text-sm"></i>
                  <span className="ml-1">RENOVAR</span>
                </Button>
              </div>
            )}

            {/* Menu do usuário */}
            {user && (
              <div className="flex justify-center">
                <div className="relative">
                  <Button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="bg-gray-700 hover:bg-gray-800 text-white font-medium px-4 py-2 text-sm rounded whitespace-nowrap"
                  >
                    <i className="ri-user-line text-sm"></i>
                    <span className="truncate text-sm ml-1">{deviceName || user.name}</span>
                    <i className="ri-arrow-down-s-line text-sm ml-1"></i>
                  </Button>

                  {showUserMenu && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {/* Informações do usuário no menu */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-medium text-gray-800">{deviceName || user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {!user.is_admin && (
                          <p className="text-sm text-blue-600 font-medium">
                            Plano {getPlanName(user.license_count)} ({user.license_count} dispositivo{user.license_count > 1 ? 's' : ''})
                          </p>
                        )}
                      </div>

                      {/* Opções do menu */}
                      <button
                        onClick={() => {
                          navigate('/inicio');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="ri-home-line mr-3"></i>
                        Início
                      </button>

                      <button
                        onClick={() => {
                          navigate('/historias');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="ri-book-line mr-3"></i>
                        Histórias
                      </button>

                      <button
                        onClick={() => {
                          navigate('/videos');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="ri-video-line mr-3"></i>
                        Vídeos
                      </button>

                      {/* Renovar - nova opção no menu */}
                      {!user.is_admin && (
                        <button
                          onClick={() => {
                            navigate('/renovar');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-orange-600 hover:bg-orange-50 flex items-center"
                        >
                          <i className="ri-refresh-line mr-3"></i>
                          Renovar
                        </button>
                      )}

                      {/* Upgrade do Plano - apenas se não for admin */}
                      {!user.is_admin && (
                        <button
                          onClick={() => {
                            handleUpgradePlan();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 flex items-center border-t border-gray-200"
                        >
                          <i className="ri-vip-crown-line mr-3"></i>
                          Upgrade do Plano
                        </button>
                      )}

                      {/* Dispositivos Conectados */}
                      <button
                        onClick={() => {
                          navigate('/gerenciar-dispositivos');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="ri-smartphone-line mr-3"></i>
                        Gerenciar Dispositivos
                      </button>

                      {/* Mudar Nome do Dispositivo */}
                      <button
                        onClick={() => {
                          setNewDeviceName(deviceName || user.name);
                          setShowDeviceNameModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="ri-edit-line mr-3"></i>
                        Mudar Nome do Dispositivo
                      </button>

                      {/* Admin */}
                      {user.is_admin && (
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-purple-600 hover:bg-purple-50 flex items-center border-t border-gray-200"
                        >
                          <i className="ri-settings-line mr-3"></i>
                          Painel Admin
                        </button>
                      )}

                      {/* Logout */}
                      <button
                        onClick={() => {
                          if (onLogout) onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center border-t border-gray-200"
                      >
                        <i className="ri-logout-box-line mr-3"></i>
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botão voltar - se necessário */}
            {shouldShowBackButton && (
              <div className="flex justify-center">
                <Button
                  onClick={handleBackClick}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 text-sm border border-gray-300 rounded whitespace-nowrap"
                >
                  <i className="ri-arrow-left-line text-sm"></i>
                  <span className="ml-1">VOLTAR</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para mudar nome do dispositivo */}
      {showDeviceNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Mudar Nome do Dispositivo</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="deviceName" className="block text-sm font-medium text-gray-7 mb-2">
                  Nome do Dispositivo
                </label>
                <input
                  id="deviceName"
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="Ex: Tablet da Maria, Celular do João..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <p className="text-sm text-gray-600">
                Este nome aparecerá no botão do menu para identificar qual criança está usando o dispositivo.
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleSaveDeviceName}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2"
              >
                Salvar
              </Button>
              <Button
                onClick={() => {
                  setShowDeviceNameModal(false);
                  setNewDeviceName('');
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold px-4 py-2"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
