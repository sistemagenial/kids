
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';

export default function Inicio() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);

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

      // Calcular dias restantes
      if (parsedUser.access_expires_at) {
        const expiryDate = new Date(parsedUser.access_expires_at);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, diffDays));
      }
    } catch (error) {
      console.error('Erro ao analisar dados do usuário:', error);
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }
    
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleRenew = async () => {
    console.log('Renovação de plano acionada');
    navigate('/renovar');
  };

  if (!user) return null;

  const handleStoriesClick = () => {
    navigate('/historias');
  };

  const handleVideosClick = () => {
    navigate('/videos');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 20%, #ef4444 40%, #8b5cf6 60%, #ec4899 80%, #3b82f6 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 25s ease infinite'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'Pacifico, serif' }}>
            Carregando...
          </h1>
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

  return (
    <div
      className="min-h-screen relative overflow-hidden gradient-animated"
    >
      {/* ✅ RESTAURADO DA VERSÃO 734: Elementos decorativos animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-10 left-10 w-12 h-12 md:w-20 md:h-20 bg-yellow-300/20 rounded-full animate-bounce"
          style={{ animationDelay: '0s', animationDuration: '3s' }}
        ></div>
        <div
          className="absolute top-32 right-20 w-10 h-10 md:w-16 md:h-16 bg-pink-300/20 rounded-full animate-bounce"
          style={{ animationDelay: '1s', animationDuration: '4s' }}
        ></div>
        <div
          className="absolute bottom-20 left-32 w-16 h-16 md:w-24 md:h-24 bg-blue-300/20 rounded-full animate-bounce"
          style={{ animationDelay: '2s', animationDuration: '5s' }}
        ></div>
        <div
          className="absolute bottom-40 right-10 w-8 h-8 md:w-12 md:h-12 bg-green-300/20 rounded-full animate-bounce"
          style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}
        ></div>
        <div
          className="absolute top-1/2 left-20 w-6 h-6 md:w-8 md:h-8 bg-purple-300/20 rounded-full animate-bounce"
          style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-10 h-10 md:w-14 md:h-14 bg-orange-300/20 rounded-full animate-bounce"
          style={{ animationDelay: '2.5s', animationDuration: '3.8s' }}
        ></div>

        {/* ✅ RESTAURADO: Estrelas piscando */}
        <div className="absolute top-20 left-1/4 text-yellow-300/70 text-xl md:text-2xl animate-pulse" style={{ animationDuration: '2s' }}>
          ⭐
        </div>
        <div className="absolute top-40 right-1/3 text-yellow-300/70 text-lg md:text-xl animate-pulse" style={{ animationDuration: '3s' }}>
          ✨
        </div>
        <div className="absolute bottom-60 left-1/2 text-yellow-300/70 text-2xl md:text-3xl animate-pulse" style={{ animationDuration: '2.5s' }}>
          🌟
        </div>
        <div className="absolute top-60 left-20 text-yellow-300/70 text-base md:text-lg animate-pulse" style={{ animationDuration: '4s' }}>
          💫
        </div>
        <div className="absolute bottom-32 right-1/3 text-yellow-300/70 text-xl md:text-2xl animate-pulse" style={{ animationDuration: '3.5s' }}>
          ⭐
        </div>
        <div className="absolute top-1/2 right-10 text-yellow-300/70 text-lg md:text-xl animate-pulse" style={{ animationDuration: '2.8s' }}>
          ✨
        </div>
      </div>

      {/* Header */}
      <Header
        user={user}
        daysRemaining={daysRemaining}
        onLogout={handleLogout}
        onRenew={handleRenew}
      />

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-8 md:py-16 relative z-10 flex-1 flex items-center justify-center main-content">
        <div className="w-full max-w-4xl">
          {/* Título principal */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg" style={{ fontFamily: 'Pacifico, serif' }}>
              Bem Vindo ao Mundo Inspirador de Deus
            </h2>
            <p className="text-lg md:text-xl text-white/90 drop-shadow max-w-2xl mx-auto">
              Descubra aventuras incríveis, aprenda valores importantes e divirta-se com nosso conteúdo especial para crianças!
            </p>
          </div>

          {/* Botão Como Navegar pelo Site */}
          <div className="text-center mb-8 md:mb-12">
            <Button
              onClick={() => navigate('/como-navegar')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold px-6 py-3 text-sm md:text-base shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-blue-300/50 whitespace-nowrap"
            >
              <i className="ri-play-circle-line mr-2"></i>
              COMO NAVEGAR PELO SITE
            </Button>
          </div>

          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-3xl mx-auto">
            {/* Card Histórias */}
            <Card 
              className="group cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl bg-gradient-to-br from-blue-50/95 to-purple-50/95 backdrop-blur-sm border-4 border-white/50 relative overflow-hidden"
              onClick={handleStoriesClick}
            >
              {/* Fundo decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 via-purple-200/30 to-pink-200/30 opacity-50"></div>
              
              {/* Elementos decorativos */}
              <div className="absolute top-4 right-4 text-4xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>
                📖
              </div>
              <div className="absolute bottom-4 left-4 text-2xl animate-pulse" style={{ animationDuration: '3s' }}>
                ⭐
              </div>
              <div className="absolute top-1/2 right-8 text-xl animate-pulse" style={{ animationDuration: '2.5s' }}>
                ✨
              </div>

              <div className="relative z-10 p-8 md:p-12 text-center">
                {/* Ícone principal */}
                <div className="mb-6 md:mb-8">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl md:text-5xl shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:rotate-12">
                    📚
                  </div>
                </div>

                {/* Título */}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 group-hover:text-blue-600 transition-colors duration-300" style={{ fontFamily: 'Pacifico, serif' }}>
                  Histórias Bíblicas
                </h3>

                {/* Descrição */}
                <p className="text-gray-600 text-sm md:text-base mb-6 leading-relaxed">
                  Histórias bíblicas ilustradas, desde a criação do mundo até os ensinamentos de Jesus!
                </p>

                {/* Recursos */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <i className="ri-check-line text-green-500 mr-2"></i>
                    Antigo e Novo Testamento
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <i className="ri-check-line text-green-500 mr-2"></i>
                    Ilustrações coloridas
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <i className="ri-check-line text-green-500 mr-2"></i>
                    Download em PDF
                  </div>
                </div>

                {/* Botão */}
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-6 py-3 text-sm md:text-base shadow-xl hover:shadow-2xl transform group-hover:scale-110 transition-all duration-300 whitespace-nowrap">
                  <i className="ri-book-open-line mr-2"></i>
                  Explorar Histórias
                </Button>
              </div>
            </Card>

            {/* Card Vídeos */}
            <Card 
              className="group cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl bg-gradient-to-br from-pink-50/95 to-orange-50/95 backdrop-blur-sm border-4 border-white/50 relative overflow-hidden"
              onClick={handleVideosClick}
            >
              {/* Fundo decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-200/30 via-orange-200/30 to-yellow-200/30 opacity-50"></div>
              
              {/* Elementos decorativos */}
              <div className="absolute top-4 right-4 text-4xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}>
                🎬
              </div>
              <div className="absolute bottom-4 left-4 text-2xl animate-pulse" style={{ animationDuration: '2s' }}>
                ⭐
              </div>
              <div className="absolute top-1/2 right-8 text-xl animate-pulse" style={{ animationDuration: '3.5s' }}>
                🎥
              </div>

              <div className="relative z-10 p-8 md:p-12 text-center">
                {/* Ícone principal */}
                <div className="mb-6 md:mb-8">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white text-4xl md:text-5xl shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:rotate-12">
                    🎬
                  </div>
                </div>

                {/* Título */}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 group-hover:text-pink-600 transition-colors duration-300" style={{ fontFamily: 'Pacifico, serif' }}>
                  Vídeos Bíblicos
                </h3>

                {/* Descrição */}
                <p className="text-gray-600 text-sm md:text-base mb-6 leading-relaxed">
                  Assista vídeos animados das histórias bíblicas mais importantes e aprenda de forma divertida!
                </p>

                {/* Recursos */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <i className="ri-check-line text-green-500 mr-2"></i>
                    Vídeos animados
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <i className="ri-check-line text-green-500 mr-2"></i>
                    Conteúdo educativo
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <i className="ri-check-line text-green-500 mr-2"></i>
                    Entretenimento cristão
                  </div>
                </div>

                {/* Botão */}
                <Button className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold px-6 py-3 text-sm md:text-base shadow-xl hover:shadow-2xl transform group-hover:scale-110 transition-all duration-300 whitespace-nowrap">
                  <i className="ri-video-line mr-2"></i>
                  Assistir Vídeos
                </Button>
              </div>
            </Card>
          </div>

          {/* Seção de recursos adicionais */}
          <div className="mt-16 md:mt-20 text-center">
            <h4 className="text-2xl md:text-3xl font-bold text-white mb-8 drop-shadow-lg" style={{ fontFamily: 'Pacifico, serif' }}>
              Você está em um ambiente seguro 🌟
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-xl border-2 border-white/50">
                <div className="text-4xl mb-4">🛡️</div>
                <h5 className="font-bold text-gray-800 mb-2">Conteúdo Seguro</h5>
                <p className="text-sm text-gray-600">Histórias cuidadosamente selecionadas e adequadas para todas as idades</p>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-xl border-2 border-white/50">
                <div className="text-4xl mb-4">⭐</div>
                <h5 className="font-bold text-gray-800 mb-2">Inspiração Divina</h5>
                <p className="text-sm text-gray-600">Descubra o mundo maravilhoso de Deus</p>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-xl border-2 border-white/50">
                <div className="text-4xl mb-4">🎓</div>
                <h5 className="font-bold text-gray-800 mb-2">Aprendizado Divertido</h5>
                <p className="text-sm text-gray-600">Combine diversão e educação com valores cristãos</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-white/80 text-sm">
          © {new Date().getFullYear()} Profeta de Deus Kids - Desenvolvido com ❤️ para as crianças
        </p>
      </footer>

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
