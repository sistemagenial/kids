
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import WhatsAppButton from '../../components/feature/WhatsAppButton';

export default function ComoNavegar() {
  const navigate = useNavigate();

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

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        {/* Botão Voltar no topo */}
        <div className="mb-6">
          <Button
            onClick={() => navigate(-1)}
            className="bg-white/90 hover:bg-white text-gray-800 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-gray-200/50 whitespace-nowrap"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Voltar
          </Button>
        </div>

        {/* Card Principal */}
        <Card className="bg-white shadow-2xl rounded-3xl border-0 overflow-hidden">
          <div className="p-8">
            {/* Logo */}
            <div className="text-center mb-6">
              <img 
                src="https://static.readdy.ai/image/90aee2f41c3492197bc6a5939c00cef4/41af0e5a6d49213fb975fa0447bec3cd.png" 
                alt="Profeta de Deus Kids" 
                className="h-12 md:h-16 mx-auto object-contain mb-4"
              />
              <h2 className="text-xl font-semibold text-purple-600 mb-2">
                Como Navegar pelo Site
              </h2>
              <p className="text-gray-600 text-sm">
                Aprenda a usar todas as funcionalidades da plataforma
              </p>
            </div>

            {/* Espaço para Vídeo */}
            <div className="mb-8">
              <div className="bg-gray-100 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
                <div className="mb-4">
                  <i className="ri-play-circle-line text-6xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Vídeo Tutorial
                </h3>
                <p className="text-gray-500 text-sm">
                  Assista ao vídeo explicativo sobre como navegar pelo site
                </p>
                <Button
                  onClick={() => {
                    // Aqui você pode adicionar o link do vídeo quando estiver disponível
                    alert('Vídeo em breve!');
                  }}
                  className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
                >
                  <i className="ri-play-line mr-2"></i>
                  Assistir Tutorial
                </Button>
              </div>
            </div>

            {/* Informações de Navegação */}
            <div className="mb-8">
              <Card className="bg-blue-50 border-blue-200">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">
                    <i className="ri-lightbulb-line mr-2"></i>
                    Dicas Importantes
                  </h3>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                      <div>
                        <strong>Login:</strong> Use seu email e CPF para acessar o sistema
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                      <div>
                        <strong>Navegação:</strong> Use os botões HISTÓRIAS e VÍDEOS para alternar entre conteúdos
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                      <div>
                        <strong>Dispositivos:</strong> Gerencie seus dispositivos conectados no menu do usuário
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                      <div>
                        <strong>Favoritos:</strong> Clique no coração para marcar histórias como favoritas
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">5</span>
                      <div>
                        <strong>Progresso:</strong> Seu progresso é salvo automaticamente conforme você lê as histórias
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-4">
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
              >
                <i className="ri-login-box-line mr-2"></i>
                Voltar para o Login
              </Button>

              <Button
                onClick={() => {
                  const whatsappMessage = `Olá! Estou com dúvidas sobre como navegar pelo site Profeta de Deus Kids.\n\nPoderia me ajudar?`;
                  const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(whatsappMessage)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full bg-gradient-to-r from-blue-5 00 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 text-sm rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
              >
                <i className="ri-question-line mr-2"></i>
                Tenho Dúvidas - Fale Conosco
              </Button>
            </div>
          </div>
        </Card>

        {/* FAQ Rápido */}
        <div className="mt-6">
          <Card className="bg-white shadow-xl rounded-3xl border-0">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                <i className="ri-question-line text-yellow-600 mr-2"></i>
                Perguntas Frequentes
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">Esqueci minha senha, o que fazer?</p>
                  <p className="text-gray-600 text-sm">Sua senha é o seu CPF e o email é login. Se ainda não conseguir acessar, entre em contato conosco pelo FALE CONOSCO.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">Posso usar em quantos dispositivos?</p>
                  <p className="text-gray-600 text-sm">Depende do seu plano: Básico (1 dispositivo), PRO (3 dispositivos), Premium (5 dispositivos). No menu no canto superior direito em cima do nome, é possível ver algumas opções, entre elas o UPGRADE, que é aumentar o limite de usuários através de um plano maior.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">Como saberei qual dispositivo esta logado na plataforma?</p>
                  <p className="text-gray-600 text-sm">Ao clicar no menu superior direito onde esta o nome, é possível renomear o dispositivo logado com o nome da criança, exemplo: Andre Celular, ou André Tablet, dessa forma, na opção GERENCIAR DISPOSITIVOS, é possível deslogar o dispositivo que não estiver sendo usado, para liberar acesso.</p>
                </div>

                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">É possível acessar de qualquer dispositivo?</p>
                  <p className="text-gray-600 text-sm">Sim, seja TV, tablet, computador, notebook ou celular.</p>
                </div>

                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">Como faço para favoritar uma história?</p>
                  <p className="text-gray-600 text-sm">Clique no ícone de coração que aparece em cada história. Suas favoritas ficam destacadas no painel.</p>
                </div>

                <div>
                  <p className="font-semibold text-purple-600 mb-1 text-base">O site funciona offline?</p>
                  <p className="text-gray-600 text-sm">Parcialmente sim, as histórias é possível vê-las por um tempo mesmo sem internet, agora os vídeos são postados no youtube, e por esse motivo é necessário ter acesso a internet para vê-los.</p>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </div>

      {/* WhatsApp Button */}
      <WhatsAppButton message="Olá! Estou com dúvidas sobre como navegar pelo site Profeta de Deus Kids. Poderia me ajudar?" />

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
