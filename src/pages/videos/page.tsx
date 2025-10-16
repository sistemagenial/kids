
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import ProgressBar from '../../components/base/ProgressBar';
import VideoCard from '../../components/feature/VideoCard';
import WhatsAppButton from '../../components/feature/WhatsAppButton';
import {
  getAllVideos,
  updateUser,
} from '../../lib/database';

type Video = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  order_number: number;
  is_new?: boolean;
  testament?: 'old' | 'new';
  thumbnail_url?: string;
  created_at: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  license_count?: number;
  access_expires_at?: string;
  videos_progress?: Record<string, boolean>;
  favorite_videos?: string[];
};

export default function Videos() {
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [filterType, setFilterType] = useState<
    | 'all'
    | 'watched'
    | 'unwatched'
    | 'new'
    | 'favorites'
    | 'old_testament'
    | 'new_testament'
  >('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          navigate('/login');
          return;
        }

        let parsedUser: User;
        try {
          parsedUser = JSON.parse(userData);
        } catch (e) {
          console.error('Failed to parse stored user data', e);
          navigate('/login');
          return;
        }

        setUser(parsedUser);

        if (parsedUser.access_expires_at) {
          const expiryDate = new Date(parsedUser.access_expires_at);
          const today = new Date();
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(Math.max(0, diffDays));
        }

        const { data: videosData } = await getAllVideos();
        if (videosData) {
          setVideos(videosData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // Escutar mudanças nos favoritos
  useEffect(() => {
    const handleFavoritesUpdate = (event: any) => {
      if (event.detail.type === 'videos') {
        if (!user) return;
        const updatedUser: User = { ...user, favorite_videos: event.detail.favorites };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    return () => window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleVideoClick = async (videoId: string) => {
    if (!user) return;
    try {
      const updatedProgress = {
        ...user.videos_progress,
        [videoId]: true,
      };
      const updatedUser = { ...user, videos_progress: updatedProgress };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      await updateUser(user.id, { videos_progress: updatedProgress });
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
    } finally {
      navigate(`/video/${videoId}`);
    }
  };

  const handleToggleFavorite = async (videoId: string) => {
    if (!user) return;

    const currentFavorites = user.favorite_videos ?? [];
    const isFavorite = currentFavorites.includes(videoId);
    const updatedFavorites = isFavorite
      ? currentFavorites.filter((id) => id !== videoId)
      : [...currentFavorites, videoId];

    // Atualizar estado local imediatamente
    const updatedUser: User = { ...user, favorite_videos: updatedFavorites };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    try {
      const { data: serverUpdatedUser } = await updateUser(user.id, { favorite_videos: updatedFavorites });

      if (serverUpdatedUser) {
        // Sincronizar com resposta do servidor
        setUser(serverUpdatedUser);
        localStorage.setItem('user', JSON.stringify(serverUpdatedUser));
      }
    } catch (error) {
      console.error('Erro ao atualizar favoritos:', error);
      // Reverter mudança local em caso de erro
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    }
  };

  const getFilteredVideos = () => {
    let filtered = videos.filter((video) =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (filterType) {
      case 'watched':
        filtered = filtered.filter(
          (video) => user?.videos_progress?.[video.id]
        );
        break;
      case 'unwatched':
        filtered = filtered.filter(
          (video) => !user?.videos_progress?.[video.id]
        );
        break;
      case 'new':
        filtered = filtered.filter((video) => video.is_new);
        break;
      case 'favorites':
        filtered = filtered.filter(
          (video) => user?.favorite_videos?.includes(video.id)
        );
        break;
      case 'old_testament':
        filtered = filtered.filter(
          (video) => video.testament === 'old'
        );
        break;
      case 'new_testament':
        filtered = filtered.filter(
          (video) => video.testament === 'new'
        );
        break;
      default:
        break;
    }
    return filtered;
  };

  const filteredVideos = getFilteredVideos();

  const completedVideos = Object.entries(user?.videos_progress ?? {})
    .filter(([videoId, completed]) => {
      // Contar apenas vídeos que existem no sistema
      const videoExists = videos.some(video => video.id === videoId);
      return completed && videoExists;
    })
    .length;

  if (!user) return null;

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
            Carregando vídeos...
          </h1>
          <p className="text-white/80 mt-2">Sincronizando com o banco de dados</p>
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
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 25%, #10b981 50%, #ec4899 75%, #3b82f6 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 25s ease infinite',
      }}
    >
      {/* Decorative animated elements */}
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

        {/* Sparkling stars */}
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

      <Header
        user={user}
        daysRemaining={daysRemaining}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-2 md:px-4 py-4 md:py-8 relative z-10">
        {/* Greeting & progress */}
        <section className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 drop-shadow-lg text-center md:text-left" style={{ fontFamily: 'Pacifico, serif' }}>
            Vídeos Bíblicos! 🎬
          </h2>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-xl border-2 border-purple-200/50">
            {/* Layout para desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="w-3/4">
                <ProgressBar progress={completedVideos} total={videos.length} />
              </div>
              <div className="w-1/4 relative">
                <input
                  type="text"
                  placeholder="Buscar vídeo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-purple-300/50 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 text-sm bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl"
                />
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 text-sm"></i>
              </div>
            </div>

            {/* Layout para mobile */}
            <div className="md:hidden space-y-4">
              <ProgressBar progress={completedVideos} total={videos.length} />
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar vídeo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-purple-300/50 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 text-sm bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl"
                />
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 text-sm"></i>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl border-2 border-purple-200/50">
            <div className="flex flex-col space-y-2 md:flex-row md:justify-center md:space-y-0 md:space-x-2 md:flex-wrap">
              {/* Todos */}
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                  filterType === 'all'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <i className="ri-list-check mr-1"></i> TODOS
              </button>

              {/* Assistidos */}
              <button
                onClick={() => setFilterType('watched')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                  filterType === 'watched'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <i className="ri-play-circle-line mr-1"></i> ASSISTIDOS
              </button>

              {/* Não assistidos */}
              <button
                onClick={() => setFilterType('unwatched')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                  filterType === 'unwatched'
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <i className="ri-play-circle-line mr-1"></i> NÃO ASSISTIDOS
              </button>

              {/* Novidades */}
              <button
                onClick={() => setFilterType('new')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                  filterType === 'new'
                    ? 'bg-orange-5 00 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <i className="ri-star-line mr-1"></i> NOVIDADES
              </button>

              {/* Favoritos */}
              <button
                onClick={() => setFilterType('favorites')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                  filterType === 'favorites'
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <i className="ri-heart-line mr-1"></i> FAVORITOS
              </button>

              {/* Antigo Testamento */}
              <button
                onClick={() => setFilterType('old_testament')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                  filterType === 'old_testament'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <i className="ri-book-2-line mr-1"></i> ANTIGO TESTAMENTO
              </button>

              {/* Novo Testamento */}
              <button
                onClick={() => setFilterType('new_testament')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                  filterType === 'new_testament'
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <i className="ri-video-line mr-1"></i> NOVO TESTAMENTO
              </button>
            </div>
          </div>
        </section>

        {/* Videos list */}
        <section>
          {videos.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-xl border-2 border-purple-200/50 max-w-md mx-auto">
                <i className="ri-video-line text-6xl text-purple-500 mb-4"></i>
                <h3 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Pacifico, serif' }}>
                  Nenhum Vídeo Cadastrado
                </h3>
                <p className="text-gray-600 mb-6">
                  O administrador ainda não adicionou vídeos ao sistema. Entre em contato para mais informações.
                </p>
                <button
                  onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Não há vídeos cadastrados no sistema', '_blank')}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap"
                >
                  <i className="ri-whatsapp-line mr-2"></i>
                  Falar com Suporte
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Vídeos sem testamento definido - mostrar primeiro */}
              {filteredVideos.filter(video => !video.testament || (video.testament !== 'old' && video.testament !== 'new')).length > 0 && (
                <>
                  <div className="mb-6">
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center drop-shadow-lg" style={{ fontFamily: 'Pacifico, serif' }}>
                      🎬 Vídeos Bíblicos!
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {filteredVideos
                      .filter(video => !video.testament || (video.testament !== 'old' && video.testament !== 'new'))
                      .map((video) => (
                        <VideoCard
                          key={video.id}
                          video={{
                            ...video,
                            order_number: video.order_number || 0
                          }}
                          isCompleted={user?.videos_progress?.[video.id] ?? false}
                          onWatch={() => handleVideoClick(video.id)}
                          isFavorite={user?.favorite_videos?.includes(video.id) ?? false}
                          onToggleFavorite={() => handleToggleFavorite(video.id)}
                        />
                      ))}
                  </div>
                </>
              )}

              {/* Antigo Testamento */}
              {filteredVideos.filter(video => video.testament === 'old').length > 0 && (
                <>
                  <div className="mb-6">
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center drop-shadow-lg" style={{ fontFamily: 'Pacifico, serif' }}>
                      📜 Antigo Testamento
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {filteredVideos
                      .filter(video => video.testament === 'old')
                      .map((video) => (
                        <VideoCard
                          key={video.id}
                          video={{
                            ...video,
                            order_number: video.order_number || 0
                          }}
                          isCompleted={user?.videos_progress?.[video.id] ?? false}
                          onWatch={() => handleVideoClick(video.id)}
                          isFavorite={user?.favorite_videos?.includes(video.id) ?? false}
                          onToggleFavorite={() => handleToggleFavorite(video.id)}
                        />
                      ))}
                  </div>
                </>
              )}

              {/* Novo Testamento */}
              {filteredVideos.filter(video => video.testament === 'new').length > 0 && (
                <>
                  <div className="mb-6">
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center drop-shadow-lg" style={{ fontFamily: 'Pacifico, serif' }}>
                      ✨ Novo Testamento
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredVideos
                      .filter(video => video.testament === 'new')
                      .map((video) => (
                        <VideoCard
                          key={video.id}
                          video={{
                            ...video,
                            order_number: video.order_number || 0
                          }}
                          isCompleted={user?.videos_progress?.[video.id] ?? false}
                          onWatch={() => handleVideoClick(video.id)}
                          isFavorite={user?.favorite_videos?.includes(video.id) ?? false}
                          onToggleFavorite={() => handleToggleFavorite(video.id)}
                        />
                      ))}
                  </div>
                </>
              )}

              {filteredVideos.length === 0 && videos.length > 0 && (
                <div className="text-center py-16">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-xl border-2 border-purple-200/50 max-w-md mx-auto">
                    <i className="ri-search-line text-6xl text-purple-500 mb-4"></i>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Pacifico, serif' }}>
                      Nenhum Vídeo Encontrado
                    </h3>
                    <p className="text-gray-600">
                      Nenhum vídeo encontrado para o filtro selecionado. Tente alterar os filtros ou busca.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-white/80 text-sm">
          © {new Date().getFullYear()} Profeta de Deus Kids - Desenvolvido com ❤️ para as crianças
        </p>
      </footer>

      {/* WhatsApp Button */}
      <WhatsAppButton message="Olá! Preciso de ajuda com os vídeos bíblicos" />

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
