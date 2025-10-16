
interface VideoCardProps {
  video: {
    id: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url?: string;
    order_number?: number;
    is_new?: boolean;
    testament?: 'old' | 'new';
  };
  onWatch?: (video: any) => void; // ✅ TORNADO OPCIONAL
  isWatched?: boolean;
  isCompleted?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (videoId: string) => void;
  onVideoClick?: (videoId: string) => Promise<void>;
}

export default function VideoCard({ video, onWatch, isWatched, isCompleted, isFavorite, onToggleFavorite, onVideoClick }: VideoCardProps) {
  // Usar thumbnail_url do vídeo se disponível, senão usar imagem gerada
  const imageUrl = video.thumbnail_url || `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28%60beautiful%20childrens%20bible%20video%20thumbnail%20for%20$%7Bvideo.title%7D%2C%20colorful%20and%20vibrant%2C%20child-friendly%20artwork%2C%20simple%20background%2C%20biblical%20scene%2C%20warm%20lighting%2C%20suitable%20for%20children%60%29%7D&width=400&height=300&seq=${video.id}&orientation=landscape`;

  const handleClick = () => {
    if (onVideoClick) {
      onVideoClick(video.id);
    } else if (onWatch) {
      onWatch(video);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 group cursor-pointer relative"
      onClick={handleClick}
    >
      {/* Número do Vídeo - Fixo no canto superior esquerdo */}
      <div className="absolute top-3 left-3 w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg z-10">
        {video.order_number || 0}
      </div>

      {/* Video Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={video.title}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 rounded-full p-4 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <i className="ri-play-fill text-3xl text-red-600"></i>
          </div>
        </div>
      </div>

      {/* Faixa NOVIDADE */}
      {video.is_new && (
        <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white text-center py-1 animate-pulse">
          <span className="text-xs font-bold tracking-wider">NOVIDADE</span>
        </div>
      )}

      {/* Conteúdo */}
      <div className="p-4">
        {/* Status e Favorito */}
        <div className="flex items-center justify-between mb-3">
          {/* Status Assistido/Não Assistido - SEM O CÍRCULO */}
          <div className="flex items-center">
            {(isWatched || isCompleted) ? (
              <div className="flex items-center text-green-600 text-xs font-bold">
                <i className="ri-check-circle-fill mr-1"></i>
                <span>ASSISTIDO</span>
              </div>
            ) : (
              <div className="flex items-center text-red-500 text-xs font-bold">
                <span>NÃO ASSISTIDO</span>
              </div>
            )}
          </div>

          {/* Botão Favoritar */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(video.id);
              }}
              className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                isFavorite
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <i className={`${isFavorite ? 'ri-heart-fill' : 'ri-heart-line'} text-2xl`}></i>
            </button>
          )}
        </div>

        {/* Título Centralizado */}
        <h3 className="font-bold text-lg text-gray-800 text-center line-clamp-2 group-hover:text-red-600 transition-colors">
          {video.title}
        </h3>
      </div>
    </div>
  );
}
