
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';
import WhatsAppButton from '../../components/feature/WhatsAppButton';

export default function Renovar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState('premium');

  useEffect(() => {
    // Verificar se o usuário está logado
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Definir Premium como padrão sempre
      setSelectedPlan('premium');
    } catch (e) {
      console.error('Falha ao parsear dados do usuário:', e);
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
  };

  const handlePayment = async () => {
    if (!user) return;

    const planDetails = {
      basic: {
        name: 'Básico',
        devices: 1,
        price: 'R$ 49,90',
        url: 'https://mpago.li/2HhCLTP',
      },
      pro: {
        name: 'PRO',
        devices: 3,
        price: 'R$ 79,90',
        url: 'https://mpago.li/1SanAMC',
      },
      premium: {
        name: 'Premium',
        devices: 5,
        price: 'R$ 99,90',
        url: 'https://mpago.li/1i2XKwS',
      },
    };

    const selectedPlanDetails = planDetails[selectedPlan as keyof typeof planDetails];
    if (!selectedPlanDetails) {
      console.error('Plano selecionado inválido:', selectedPlan);
      return;
    }

    try {
      // Usar PHP em vez do Supabase
      const response = await fetch('/api/send-email.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'renewal',
          userName: user.name,
          userEmail: user.email,
          userCpf: user.cpf,
          selectedPlan: selectedPlanDetails.name,
          planPrice: selectedPlanDetails.price,
          planDevices: `${selectedPlanDetails.devices} dispositivos`,
        }),
      });

      if (response.ok) {
        console.log('Email de renovação enviado com sucesso');
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('Erro ao enviar email de renovação:', response.status, errorText);
      }
    } catch (error) {
      console.error('Erro ao enviar email de renovação:', error);
    }

    // Redirecionar para o link de pagamento do plano selecionado
    window.open(selectedPlanDetails.url, '_blank');

    const message = `Olá! Gostaria de renovar minha licença para o Plano ${selectedPlanDetails.name} (${selectedPlanDetails.devices} dispositivos) por ${selectedPlanDetails.price} anual.

*Dados da conta:*
Nome: ${user.name}
Email: ${user.email}
CPF: ${user.cpf}

Como posso proceder com o pagamento da renovação?`;

    const whatsappUrl = `https://wa.me/5517997815756?text=${encodeURIComponent(message)}`; // ✅ CORRIGIDO: Número atualizado
    window.open(whatsappUrl, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('trusted_ip');
    localStorage.removeItem('registered_devices');
    localStorage.removeItem('remembered_email');
    localStorage.removeItem('remembered_password');
    localStorage.removeItem('biometric_user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #3b82f6 0%, #f97316 20%, #ef4444 40%, #8b5cf6 60%, #ec4899 80%, #3b82f6 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 25s ease infinite',
      }}
    >
      {/* Elementos decorativos animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-10 left-10 w-12 h-12 md:w-20 md:h-20 bg-yellow-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '0s', animationDuration: '3s' }}
        ></div>
        <div
          className="absolute top-32 right-20 w-10 h-10 md:w-16 md:h-16 bg-pink-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '1s', animationDuration: '4s' }}
        ></div>
        <div
          className="absolute bottom-20 left-32 w-16 h-16 md:w-24 md:h-24 bg-blue-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '2s', animationDuration: '5s' }}
        ></div>
        <div
          className="absolute bottom-40 right-10 w-8 h-8 md:w-12 md:h-12 bg-green-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}
        ></div>

        {/* Estrelas piscando */}
        <div
          className="absolute top-20 left-1/4 text-yellow-300 text-xl md:text-2xl animate-pulse"
          style={{ animationDuration: '2s' }}
        >
          ⭐
        </div>
        <div
          className="absolute top-40 right-1/3 text-yellow-300 text-lg md:text-xl animate-pulse"
          style={{ animationDuration: '3s' }}
        >
          ✨
        </div>
        <div
          className="absolute bottom-60 left-1/2 text-yellow-300 text-2xl md:text-3xl animate-pulse"
          style={{ animationDuration: '2.5s' }}
        >
          🌟
        </div>
      </div>

      {/* Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        showBackButton={true}
        onBack={() => navigate(-1)}
      />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Título */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg"
            style={{ fontFamily: 'Pacifico, serif' }}
          >
            Renovar Licença
          </h1>
          <p className="text-white/90 text-lg md:text-xl drop-shadow">
            Escolha seu novo plano e renove seu acesso
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-purple-200/50 shadow-2xl">
            <div className="p-6 md:p-8">
              {/* Informações do usuário atual */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-8">
                <h3 className="font-bold text-blue-800 mb-2">
                  <i className="ri-user-line mr-2"></i>
                  Conta Atual
                </h3>
                <p className="text-sm text-blue-700">
                  <strong>Nome:</strong> {user.name}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Email:</strong> {user.email}
                </p>
                {user.whatsapp && (
                  <p className="text-sm text-blue-700">
                    <strong>WhatsApp:</strong> {user.whatsapp}
                  </p>
                )}
                <p className="text-sm text-blue-700">
                  <strong>Plano Atual:</strong>{' '}
                  {user.license_count === 1
                    ? 'Básico'
                    : user.license_count === 3
                    ? 'PRO'
                    : user.license_count === 5
                    ? 'Premium'
                    : `${user.license_count} dispositivos`}
                </p>
              </div>

              {/* Escolha do Plano */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Escolha seu Plano</h3>

                <div className="space-y-4">
                  {/* Plano Básico */}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedPlan === 'basic'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handlePlanSelect('basic')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">📱</span>
                          <h4 className="font-bold text-gray-800">Plano Básico</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Até 1 dispositivo simultâneo</p>
                        <p className="font-bold text-blue-600 text-lg">R$ 49,90 (Anual)</p>
                        <p className="text-sm text-green-600">em 3x sem juros</p>
                      </div>
                      <input
                        type="radio"
                        name="plan"
                        value="basic"
                        checked={selectedPlan === 'basic'}
                        onChange={() => handlePlanSelect('basic')}
                        className="w-5 h-5"
                      />
                    </div>
                  </div>

                  {/* Plano PRO */}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedPlan === 'pro'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => handlePlanSelect('pro')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">🔥</span>
                          <h4 className="font-bold text-gray-800">Plano PRO</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Até 3 dispositivos simultâneos</p>
                        <p className="font-bold text-orange-600 text-lg">R$ 79,90 (Anual)</p>
                        <p className="text-sm text-green-600">em 3x sem juros</p>
                      </div>
                      <input
                        type="radio"
                        name="plan"
                        value="pro"
                        checked={selectedPlan === 'pro'}
                        onChange={() => handlePlanSelect('pro')}
                        className="w-5 h-5"
                      />
                    </div>
                  </div>

                  {/* Plano Premium */}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 relative ${
                      selectedPlan === 'premium'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => handlePlanSelect('premium')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">🚀</span>
                          <h4 className="font-bold text-gray-800">Plano Premium</h4>
                          <span className="ml-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Até 5 dispositivos simultâneos</p>
                        <p className="font-bold text-purple-600 text-lg">R$ 99,90 (Anual)</p>
                        <p className="text-sm text-green-600">em 3x sem juros</p>
                      </div>
                      <input
                        type="radio"
                        name="plan"
                        value="premium"
                        checked={selectedPlan === 'premium'}
                        onChange={() => handlePlanSelect('premium')}
                        className="w-5 h-5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informação adicional */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                <p className="text-sm text-blue-800 text-center">
                  <i className="ri-information-line mr-1"></i>
                  Você pode mudar seu plano a qualquer momento. Só falar conosco! Assim que
                  efetuar o pagamento receberá seu acesso em até 24 horas
                </p>
              </div>

              {/* Botão de Pagamento */}
              <div className="mt-8">
                <Button
                  onClick={handlePayment}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
                >
                  <i className="ri-whatsapp-line mr-2"></i>
                  Efetuar Pagamento
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* WhatsApp Button */}
      <WhatsAppButton message="Olá! Tenho dúvidas sobre a renovação da minha licença do Profeta de Deus Kids" />

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
