
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import WhatsAppButton from '../../components/feature/WhatsAppButton';

interface PlanInfo {
  name: string;
  devices: number;
  price: string;
  paymentUrl: string;
}

export default function BoasVindas() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(30);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [customerName, setCustomerName] = useState('Cliente');

  // URLs de pagamento atualizados
  const paymentUrls = {
    basic: 'https://mpago.li/2HhCLTP',
    pro: 'https://mpago.li/1SanAMC', 
    premium: 'https://mpago.li/1i2XKwS'
  };

  const planDetails = {
    basic: { name: 'Básico', devices: 1, price: 'R$ 49,90' },
    pro: { name: 'PRO', devices: 3, price: 'R$ 79,90' },
    premium: { name: 'Premium', devices: 5, price: 'R$ 99,90' }
  };

  useEffect(() => {
    // Obter o nome do cliente do localStorage ou estado
    const userData = localStorage.getItem('user');
    const purchaseData = localStorage.getItem('purchase_data');
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCustomerName(user.name || 'Cliente');
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
      }
    } else if (purchaseData) {
      try {
        const purchase = JSON.parse(purchaseData);
        setCustomerName(purchase.name || 'Cliente');
      } catch (error) {
        console.error('Erro ao parsear dados da compra:', error);
      }
    } else if (location.state?.customerName) {
      setCustomerName(location.state.customerName);
    }

    // Obter o plano selecionado dos parâmetros da URL ou estado
    const searchParams = new URLSearchParams(location.search);
    const selectedPlan = searchParams.get('plan') || location.state?.plan || 'premium';
    
    if (planDetails[selectedPlan as keyof typeof planDetails]) {
      const plan = planDetails[selectedPlan as keyof typeof planDetails];
      setPlanInfo({
        name: plan.name,
        devices: plan.devices,
        price: plan.price,
        paymentUrl: paymentUrls[selectedPlan as keyof typeof paymentUrls]
      });
    } else {
      // Plano padrão Premium se não encontrar
      setPlanInfo({
        name: 'Premium',
        devices: 5,
        price: 'R$ 99,90',
        paymentUrl: paymentUrls.premium
      });
    }
  }, [location]);

  useEffect(() => {
    // Contagem regressiva
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirecionar automaticamente quando chegar a 0
      if (planInfo?.paymentUrl) {
        window.open(planInfo.paymentUrl, '_blank');
      }
    }
  }, [countdown, planInfo]);

  const handlePaymentRedirect = () => {
    if (planInfo?.paymentUrl) {
      window.open(planInfo.paymentUrl, '_blank');
    }
  };

  if (!planInfo) {
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
          className="absolute top-10 left-10 w-8 h-8 md:w-20 md:h-20 bg-yellow-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '0s', animationDuration: '3s' }}
        ></div>
        <div
          className="absolute top-32 right-20 w-6 h-6 md:w-16 md:h-16 bg-pink-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '1s', animationDuration: '4s' }}
        ></div>
        <div
          className="absolute bottom-20 left-32 w-10 h-10 md:w-24 md:h-24 bg-blue-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '2s', animationDuration: '5s' }}
        ></div>
        <div
          className="absolute bottom-40 right-10 w-6 h-6 md:w-12 md:h-12 bg-green-300/30 rounded-full animate-bounce"
          style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}
        ></div>

        {/* Estrelas piscando */}
        <div
          className="absolute top-20 left-1/4 text-yellow-300 text-lg md:text-2xl animate-pulse"
          style={{ animationDuration: '2s' }}
        >
          ⭐
        </div>
        <div
          className="absolute top-40 right-1/3 text-yellow-300 text-base md:text-xl animate-pulse"
          style={{ animationDuration: '3s' }}
        >
          ✨
        </div>
        <div
          className="absolute bottom-60 left-1/2 text-yellow-300 text-xl md:text-3xl animate-pulse"
          style={{ animationDuration: '2.5s' }}
        >
          🌟
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto w-full">
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-green-200/50 shadow-2xl">
            <div className="p-4 md:p-8 text-center">
              
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mb-4">
                  <img 
                    src="https://static.readdy.ai/image/90aee2f41c3492197bc6a5939c00cef4/41af0e5a6d49213fb975fa0447bec3cd.png" 
                    alt="Profeta de Deus Kids" 
                    className="h-12 md:h-16 mx-auto object-contain"
                  />
                </div>
                <p className="text-white/90 text-lg md:text-xl drop-shadow">
                  Adquira sua licença de acesso
                </p>
              </div>

              {/* Ícone de sucesso */}
              <div className="mb-4 md:mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <i className="ri-check-line text-3xl md:text-4xl text-green-600"></i>
                </div>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-3 md:mb-4" style={{ fontFamily: 'Pacifico, serif' }}>
                  Olá, {customerName}!
                </h1>
              </div>

              {/* Mensagem personalizada */}
              <div className="mb-6 md:mb-8">
                <p className="text-base md:text-xl text-gray-700 mb-3 md:mb-4 leading-relaxed">
                  Acabou de escolher o <span className="font-bold text-purple-600">Plano {planInfo.name}</span> e fazer uma ótima escolha! 
                </p>
                <p className="text-base md:text-xl text-gray-700 mb-4 md:mb-6 leading-relaxed">
                  Que Deus abençoe grandemente sua vida! 🙏
                </p>

                {/* Informações do plano selecionado */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 md:p-6 rounded-xl border-2 border-purple-200/50 mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-purple-700 mb-2 md:mb-3">
                    📋 Resumo do seu plano:
                  </h3>
                  <div className="space-y-1 md:space-y-2 text-sm md:text-base text-gray-770">
                    <p><strong>Plano:</strong> {planInfo.name}</p>
                    <p><strong>Dispositivos:</strong> Até {planInfo.devices} simultâneos</p>
                    <p><strong>Valor:</strong> {planInfo.price} (Anual)</p>
                    <p><strong>Parcelamento:</strong> Em 3x sem juros</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200 mb-4 md:mb-6">
                  <p className="text-blue-800 text-sm md:text-lg">
                    <i className="ri-information-line mr-2"></i>
                    Assim que seu pagamento for confirmado, em até <strong>24 horas</strong> você receberá no E-mail e WhatsApp cadastrado os dados de acesso à plataforma.
                  </p>
                </div>
              </div>

              {/* Botão de redirecionamento com contagem regressiva */}
              <div className="space-y-3 md:space-y-4">
                <Button
                  onClick={handlePaymentRedirect}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 md:py-4 text-sm md:text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap px-2"
                >
                  <i className="ri-secure-payment-line mr-1 md:mr-2"></i>
                  <span className="text-xs md:text-lg">DIRECIONANDO AO PAGAMENTO</span>
                </Button>

                {/* Contagem regressiva */}
                <div className="bg-yellow-50 p-3 md:p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-xs md:text-base">
                    <i className="ri-time-line mr-2"></i>
                    Redirecionamento automático em: <span className="font-bold text-lg md:text-xl">{countdown}</span> segundos
                  </p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Clique no botão acima se não quiser esperar
                  </p>
                </div>

                {/* Botão secundário */}
                <Button
                  onClick={() => navigate('/como-navegar')}
                  variant="secondary"
                  className="w-full mt-3 md:mt-4 whitespace-nowrap text-sm md:text-base py-2 md:py-3"
                >
                  <i className="ri-play-circle-line mr-2"></i>
                  Como Navegar pelo Site
                </Button>
              </div>

              {/* Informações adicionais */}
              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm text-gray-600">
                  <div className="flex items-center justify-center md:justify-start">
                    <i className="ri-shield-check-line text-green-500 mr-2"></i>
                    <span>Pagamento 100% seguro</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start">
                    <i className="ri-customer-service-line text-blue-500 mr-2"></i>
                    <span className="text-center md:text-left">Suporte Seg a Sex das 8 as 15 horas</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start">
                    <i className="ri-refresh-line text-purple-500 mr-2"></i>
                    <span>Atualizações Inclusas no plano</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start">
                    <i className="ri-device-line text-orange-500 mr-2"></i>
                    <span>Funciona em todos os dispositivos</span>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </div>

      {/* WhatsApp Button */}
      <WhatsAppButton message={`Olá! Acabei de escolher o Plano ${planInfo.name} do Profeta de Deus Kids e tenho algumas dúvidas sobre o pagamento.`} />

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
