
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Button from '../../components/base/Button';
import WhatsAppButton from '../../components/feature/WhatsAppButton';
import { getVideoById, getAllVideos, updateUser } from '../../lib/database';
import { useToastContext } from '../../contexts/ToastContext';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  order_number: number;
  is_new?: boolean;
  created_at: string;
  testament?: string;
}

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWatched, setIsWatched] = useState(false);
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

        // Carregar todos os vídeos para navegação
        const { data: allVideos } = await getAllVideos();
        if (allVideos) {
          const sortedVideos = allVideos.sort((a: Video, b: Video) => a.order_number - b.order_number);
          setVideos(sortedVideos);
        }

        if (id) {
          const { data: videoData } = await getVideoById(id);
          if (videoData) {
            setVideo(videoData);
            setIsWatched(parsedUser.videos_progress?.[id] || false);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar vídeo:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  // Marcar como assistido quando o vídeo carrega
  useEffect(() => {
    if (user && video && !isWatched) {
      const markAsWatched = async () => {
        try {
          const currentProgress = user.videos_progress || {};
          const updatedProgress = { ...currentProgress, [video.id]: true };
          
          const updatedUser = { ...user, videos_progress: updatedProgress };
          setUser(updatedUser);
          setIsWatched(true);
          localStorage.setItem('user', JSON.stringify(updatedUser));

          await updateUser(user.id, { videos_progress: updatedProgress });
          toast.success('Vídeo marcado como assistido', '');
        } catch (error) {
          console.error('Erro ao marcar vídeo como assistido:', error);
        }
      };

      // Marcar como assistido após 3 segundos
      const timer = setTimeout(markAsWatched, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, video, isWatched, toast]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getEmbedUrl = (url: string) => {
    // YouTube
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    // Se já for um embed URL, retorna como está
    if (url.includes('/embed/') || url.includes('player.vimeo.com')) {
      return url;
    }
    
    // Fallback para outros casos
    return url;
  };

  const renderVideoPlayer = () => {
    if (!video) return null;
    
    const embedUrl = getEmbedUrl(video.video_url);
    
    return (
      <iframe
        src={embedUrl}
        title={video.title}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    );
  };

  // Calcular vídeos anterior e próximo - CORRIGIDO COM NORMALIZAÇÃO DE IDs
  const currentIndex = videos.findIndex(v => String(v.id) === String(video?.id));
  const previousVideo = currentIndex > 0 ? videos[currentIndex - 1] : null;
  const nextVideo = currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null;

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
            Carregando vídeo...
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

  if (!video) {
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
          onBack={() => navigate('/videos')}
        />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Pacifico, serif' }}>
            Vídeo não encontrado
          </h1>
          <Button onClick={() => navigate('/videos')} className="bg-purple-500 hover:bg-purple-600 text-white">
            Voltar para Vídeos
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
        onBack={() => navigate('/videos')}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/videos')}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <i className="ri-arrow-left-line text-2xl"></i>
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{video.title}</h1>
                  <div className="flex items-center space-x-4 text-red-100">
                    <span className="flex items-center">
                      <i className="ri-video-line mr-1"></i>
                      Vídeo #{video.order_number}
                    </span>
                    {video.testament && (
                      <span className="flex items-center">
                        <i className="ri-bookmark-line mr-1"></i>
                        {video.testament === 'old' ? 'Antigo Testamento' : 'Novo Testamento'}
                      </span>
                    )}
                    {video.is_new && (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        NOVIDADE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className="relative bg-black">
            <div className="aspect-video">
              {renderVideoPlayer()}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {video.description && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">Sobre este vídeo</h3>
                <p className="text-gray-700 leading-relaxed">{video.description}</p>
              </div>
            )}

            {/* Navigation - BOTÕES CORRIGIDOS COM 3 OPÇÕES PARA VÍDEOS */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Botão Vídeo Anterior */}
              {previousVideo ? (
                <button
                  onClick={() => navigate(`/video/${previousVideo.id}`)}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap w-full md:w-auto flex items-center justify-center"
                  title={`Anterior: ${previousVideo.title}`}
                >
                  <i className="ri-arrow-left-s-line mr-2"></i>
                  Vídeo Anterior
                </button>
              ) : (
                <div className="w-full md:w-auto"></div>
              )}

              {/* Botão Todos os Vídeos - SEMPRE VISÍVEL */}
              <button
                onClick={() => navigate('/videos')}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap w-full md:w-auto flex items-center justify-center"
              >
                <i className="ri-video-line mr-2"></i>
                Todos os Vídeos
              </button>

              {/* Botão Vídeo Seguinte */}
              {nextVideo ? (
                <button
                  onClick={() => navigate(`/video/${nextVideo.id}`)}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap w-full md:w-auto flex items-center justify-center"
                  title={`Próximo: ${nextVideo.title}`}
                >
                  Próximo Vídeo
                  <i className="ri-arrow-right-s-line ml-2"></i>
                </button>
              ) : (
                <div className="w-full md:w-auto"></div>
              )}
            </div>
          </div>
        </div>
      </main>

      <WhatsAppButton message={`Olá! Estou assistindo o vídeo "${video.title}" e gostaria de mais informações`} />

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
