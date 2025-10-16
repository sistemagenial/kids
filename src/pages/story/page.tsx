
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Button from '../../components/base/Button';
import WhatsAppButton from '../../components/feature/WhatsAppButton';
import { getStoryById, getAllStories, updateUser } from '../../lib/database';
import { useToastContext } from '../../contexts/ToastContext';
import ReadingEnhancer from '../../components/feature/ReadingEnhancer';

interface Story {
  id: string;
  title: string;
  content: string;
  order_number: number;
  image_url?: string;
  pdf_url?: string;
  is_new?: boolean;
  created_at: string;
  testament?: string;
}

export default function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const navigate = useNavigate();
  const toast = useToastContext();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          navigate('/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Carregar todas as histórias para navegação
        const { data: allStories } = await getAllStories();
        if (allStories) {
          // CORRIGIDO: Usar order_number que vem da API (mapeado de position_number)
          const sortedStories = allStories.sort((a: Story, b: Story) => a.order_number - b.order_number);
          setStories(sortedStories);
          console.log('📚 Histórias carregadas e ordenadas:', sortedStories.map((s: Story) => ({ id: s.id, title: s.title, order: s.order_number })));
        }

        if (id) {
          const { data: storyData } = await getStoryById(id);
          if (storyData) {
            setStory(storyData);
            setIsCompleted(parsedUser.stories_progress?.[id] || false);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar história:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  // Marcar como lida quando a história carrega
  useEffect(() => {
    if (user && story && !isCompleted) {
      const markAsCompleted = async () => {
        try {
          const currentProgress = user.stories_progress || {};
          const updatedProgress = { ...currentProgress, [story.id]: true };
          
          const updatedUser = { ...user, stories_progress: updatedProgress };
          setUser(updatedUser);
          setIsCompleted(true);
          localStorage.setItem('user', JSON.stringify(updatedUser));

          await updateUser(user.id, { stories_progress: updatedProgress });
          toast.success('História marcada como lida', '');
        } catch (error) {
          console.error('Erro ao marcar história como lida:', error);
        }
      };

      // Marcar como lida após 5 segundos
      const timer = setTimeout(markAsCompleted, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, story, isCompleted, toast]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // CORRIGIDO: Calcular histórias anterior e próxima usando order_number E normalizando IDs
  const currentIndex = stories.findIndex(s => String(s.id) === String(story?.id));
  const previousStory = currentIndex > 0 ? stories[currentIndex - 1] : null;
  const nextStory = currentIndex < stories.length - 1 ? stories[currentIndex + 1] : null;

  console.log('🔍 Navegação:', {
    currentIndex,
    currentStory: story?.title,
    previousStory: previousStory?.title,
    nextStory: nextStory?.title,
    totalStories: stories.length
  });

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 25%, #10b981 50%, #ec4899 75%, #3b82f6 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 25s ease infinite',
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'Pacifico, serif' }}>
            Carregando história...
          </h1>
        </div>

        <style>{`
          @keyframes gradientShift {
            0%   { background-position: 0% 50%; }
            25%  { background-position: 25% 50%; }
            50%  { background-position: 50% 50%; }
            75%  { background-position: 75% 50%; }
            100% { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    );
  }

  if (!story) {
    return (
      <div
        className="min-h-screen"
        style={{
          background:
            'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 25%, #10b981 50%, #ec4899 75%, #3b82f6 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 25s ease infinite',
        }}
      >
        <Header
          user={user}
          onLogout={handleLogout}
          showBackButton
          onBack={() => navigate('/historias')}
        />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Pacifico, serif' }}>
            História não encontrada
          </h1>
          <Button onClick={() => navigate('/historias')} className="bg-purple-500 hover:bg-purple-600 text-white">
            Voltar para Histórias
          </Button>
        </div>

        <style>{`
          @keyframes gradientShift {
            0%   { background-position: 0% 50%; }
            25%  { background-position: 25% 50%; }
            50%  { background-position: 50% 50%; }
            75%  { background-position: 75% 50%; }
            100% { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 25%, #10b981 50%, #ec4899 75%, #3b82f6 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 25s ease infinite',
      }}
    >
      <Header
        user={user}
        onLogout={handleLogout}
        showBackButton
        onBack={() => navigate('/historias')}
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/historias')}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <i className="ri-arrow-left-line text-2xl"></i>
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{story.title}</h1>
                  <div className="flex items-center space-x-4 text-purple-100">
                    <span className="flex items-center">
                      <i className="ri-book-line mr-1"></i>
                      História #{story.order_number}
                    </span>
                    {story.testament && (
                      <span className="flex items-center">
                        <i className="ri-bookmark-line mr-1"></i>
                        {story.testament === 'old' ? 'Antigo Testamento' : 'Novo Testamento'}
                      </span>
                    )}
                    {story.is_new && (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        NOVIDADE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story Image - CORRIGIDA PARA APARECER INTEIRA */}
          {story.image_url && (
            <div className="relative overflow-hidden">
              <img
                src={story.image_url}
                alt={story.title}
                className="w-full h-auto object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap"
                style={{ lineHeight: '1.8' }}
              >
                {story.content}
              </div>
            </div>

            {/* PDF Download - TEXTO ATUALIZADO */}
            {story.pdf_url && (
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="ri-file-pdf-line text-2xl text-red-600 mr-3"></i>
                    <div>
                      <h3 className="font-semibold text-gray-800">Versão em PDF</h3>
                      <p className="text-sm text-gray-600">Baixe esta história + desenho para pintar em PDF</p>
                    </div>
                  </div>
                  <a
                    href={story.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <i className="ri-download-line mr-2"></i>
                    Baixar PDF
                  </a>
                </div>
              </div>
            )}

            {/* Navigation - BOTÕES CORRIGIDOS COM 3 OPÇÕES */}
            <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Botão História Anterior */}
              {previousStory ? (
                <button
                  onClick={() => navigate(`/story/${previousStory.id}`)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap w-full md:w-auto flex items-center justify-center"
                  title={`Anterior: ${previousStory.title}`}
                >
                  <i className="ri-arrow-left-s-line mr-2"></i>
                  História Anterior
                </button>
              ) : (
                <div className="w-full md:w-auto"></div>
              )}

              {/* Botão Todas as Histórias - SEMPRE VISÍVEL */}
              <button
                onClick={() => navigate('/historias')}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap w-full md:w-auto flex items-center justify-center"
              >
                <i className="ri-book-line mr-2"></i>
                Todas as Histórias
              </button>

              {/* Botão História Seguinte */}
              {nextStory ? (
                <button
                  onClick={() => navigate(`/story/${nextStory.id}`)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap w-full md:w-auto flex items-center justify-center"
                  title={`Próxima: ${nextStory.title}`}
                >
                  Próxima História
                  <i className="ri-arrow-right-s-line ml-2"></i>
                </button>
              ) : (
                <div className="w-full md:w-auto"></div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Componente de melhoria da leitura */}
      <ReadingEnhancer />

      {/* WhatsApp Button */}
      <WhatsAppButton message={`Olá! Estou lendo a história: ${story.title}`} />

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-white/80 text-sm">
          © {new Date().getFullYear()} Profeta de Deus Kids - Desenvolvido com ❤️ para as crianças
        </p>
      </footer>

      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          25%  { background-position: 25% 50%; }
          50%  { background-position: 50% 50%; }
          75%  { background-position: 75% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
