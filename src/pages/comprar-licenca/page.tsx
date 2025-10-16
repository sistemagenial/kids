
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import Input from '../../components/base/Input';
import WhatsAppButton from '../../components/feature/WhatsAppButton';
import { createPurchaseOrder } from '../../lib/database';

export default function ComprarLicenca() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    whatsapp: '',
    plan: 'premium' as 'basic' | 'pro' | 'premium'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlanSelect = (plan: 'basic' | 'pro' | 'premium') => {
    setFormData(prev => ({
      ...prev,
      plan
    }));
  };

  const handlePayment = async () => {
    // Validar campos obrigatórios
    if (!formData.name.trim()) {
      alert('Por favor, preencha o campo Nome');
      return;
    }
    
    if (!formData.email.trim()) {
      alert('Por favor, preencha o campo Email');
      return;
    }
    
    if (!formData.cpf.trim()) {
      alert('Por favor, preencha o campo CPF');
      return;
    }
    
    if (!formData.whatsapp.trim()) {
      alert('Por favor, preencha o campo WhatsApp');
      return;
    }

    const planDetails = {
      basic: { name: 'Básico', devices: 1, price: 'R$ 49,90' },
      pro: { name: 'PRO', devices: 3, price: 'R$ 79,90' },
      premium: { name: 'Premium', devices: 5, price: 'R$ 99,90' }
    };

    const selectedPlan = planDetails[formData.plan];
    
    try {
      // Salvar dados da compra no localStorage para usar na página de boas-vindas
      const purchaseData = {
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf,
        whatsapp: formData.whatsapp,
        plan: formData.plan,
        planDetails: selectedPlan
      };
      localStorage.setItem('purchase_data', JSON.stringify(purchaseData));

      // Salvar pedido no banco local
      await createPurchaseOrder(purchaseData);

      // Usar PHP em vez do Supabase
      const response = await fetch('/api/send-email.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'purchase',
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf,
          whatsapp: formData.whatsapp,
          plan: formData.plan,
          planDetails: selectedPlan,
        }),
      });

      if (response.ok) {
        console.log('Email de compra enviado com sucesso');
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('Erro ao enviar email de compra:', response.status, errorText);
      }
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
    }

    // Redirecionar para página de boas-vindas com o plano selecionado e nome do cliente
    navigate(`/boas-vindas?plan=${formData.plan}`, {
      state: { 
        plan: formData.plan,
        customerName: formData.name
      }
    });
  };

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

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-md">
        {/* Card Principal */}
        <Card className="bg-white shadow-2xl rounded-3xl border-0 overflow-hidden">
          <div className="p-8">
            {/* Logo */}
            <div className="text-center mb-6">
              <img 
                src="https://static.readdy.ai/image/90aee2f41c3492197bc6a5939c00cef4/41af0e5a6d49213fb975fa0447bec3cd.png" 
                alt="Profeta de Deus Kids" 
                className="h-16 mx-auto object-contain mb-4"
              />
              <p className="text-gray-600 text-sm">
                Adquira sua licença de acesso
              </p>
            </div>

            {/* Formulário */}
            <div className="space-y-4 mb-6">
              <Input
                type="text"
                placeholder="Nome"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-gray-50 border-2 border-gray-300 rounded-xl py-4 px-4 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-500 hover:border-gray-400 transition-all"
                required
              />

              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-gray-50 border-2 border-gray-300 rounded-xl py-4 px-4 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:bg-white focus-border-purple-500 hover:border-gray-400 transition-all"
                required
              />

              <Input
                type="text"
                placeholder="CPF"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                className="bg-gray-50 border-2 border-gray-300 rounded-xl py-4 px-4 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:bg-white focus-border-purple-500 hover:border-gray-400 transition-all"
                required
              />

              <Input
                type="tel"
                placeholder="WhatsApp (ex: 11999999999)"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                className="bg-gray-50 border-2 border-gray-300 rounded-xl py-4 px-4 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-500 hover:border-gray-400 transition-all"
                required
              />

              {/* Escolha do Plano */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Escolha seu Plano</h3>
                
                <div className="space-y-3">
                  {/* Plano Básico */}
                  <div
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      formData.plan === 'basic'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handlePlanSelect('basic')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-lg mr-2">📱</span>
                          <h4 className="font-semibold text-gray-800 text-sm">Plano Básico</h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">Até 1 dispositivo simultâneo</p>
                        <p className="font-bold text-blue-600 text-sm">R$ 49,90 (Anual)</p>
                      </div>
                      <input
                        type="radio"
                        name="plan"
                        value="basic"
                        checked={formData.plan === 'basic'}
                        onChange={() => handlePlanSelect('basic')}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>

                  {/* Plano PRO */}
                  <div
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      formData.plan === 'pro'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => handlePlanSelect('pro')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-lg mr-2">🔥</span>
                          <h4 className="font-semibold text-gray-800 text-sm">Plano PRO</h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">Até 3 dispositivos simultâneos</p>
                        <p className="font-bold text-orange-600 text-sm">R$ 79,90 (Anual)</p>
                      </div>
                      <input
                        type="radio"
                        name="plan"
                        value="pro"
                        checked={formData.plan === 'pro'}
                        onChange={() => handlePlanSelect('pro')}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>

                  {/* Plano Premium */}
                  <div
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 relative ${
                      formData.plan === 'premium'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => handlePlanSelect('premium')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-lg mr-2">🚀</span>
                          <h4 className="font-semibold text-gray-800 text-sm">Plano Premium</h4>
                          <span className="ml-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">Recomendado</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">Até 5 dispositivos simultâneos</p>
                        <p className="font-bold text-purple-600 text-sm">R$ 99,90 (Anual)</p>
                      </div>
                      <input
                        type="radio"
                        name="plan"
                        value="premium"
                        checked={formData.plan === 'premium'}
                        onChange={() => handlePlanSelect('premium')}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-3 mt-8">
                <Button
                  onClick={handlePayment}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 text-sm rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
                >
                  <i className="ri-secure-payment-line mr-2"></i>
                  Efetuar Pagamento
                </Button>

                <Button
                  onClick={() => navigate('/como-navegar')}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 text-sm rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
                >
                  <i className="ri-play-circle-line mr-2"></i>
                  COMO NAVEGAR PELO SITE
                </Button>
              </div>

              {/* Link para login */}
              <div className="text-center pt-4">
                <p className="text-xs text-gray-600 mb-2">Já tem uma conta?</p>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Fazer login
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* FAQ */}
        <div className="mt-6">
          <Card className="bg-white shadow-xl rounded-3xl border-0">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                <i className="ri-question-line text-yellow-600 mr-2"></i>
                Perguntas Frequentes
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">Qual a diferença entre os planos?</p>
                  <p className="text-gray-600 text-sm">A diferença está na quantidade de dispositivos que podem acessar simultaneamente: Básico (1), PRO (3), Premium (5). Seja Computador, Notebook, Tablet ou Celular.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">Posso trocar de plano depois?</p>
                  <p className="text-gray-600 text-sm">Sim! Entre em contato conosco pelo FALE CONOSCO para fazer upgrade do seu plano a qualquer momento.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">Quanto tempo dura a licença de acesso e como renovar?</p>
                  <p className="text-gray-600 text-sm">Qualquer licença tem duração de 365 dias, no canto superior direito do site é possível ver a quantidade de dias restantes de acesso, e no menu superior direito, ao clicar sobre o nome.</p>
                </div>

                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">O pagamento é seguro?</p>
                  <p className="text-gray-600 text-sm">Sim, utilizamos o sistema de pagamento do Mercado Pago, que é totalmente seguro e confiável.</p>
                </div>

                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">Quanto tempo demora para liberar o acesso?</p>
                  <p className="text-gray-600 text-sm">Após a confirmação do pagamento, o acesso é liberado em até 24 horas úteis.</p>
                </div>

                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">É feito atualizações do conteúdo?</p>
                  <p className="text-gray-600 text-sm">Sim, semanalmente são incluídas novas histórias e desenhos sobre passagens bíblicas.</p>
                </div>

                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">Terei direito as atualizações?</p>
                  <p className="text-gray-600 text-sm">Sim, toda e qualquer atualização seja das historias, vídeos ou qualquer outro recurso futuro, ficará disponível enquanto sua assinatura estiver vigente.</p>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </div>

      {/* WhatsApp Button */}
      <WhatsAppButton message="Olá! Tenho dúvidas sobre os planos do Profeta de Deus Kids" />

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
