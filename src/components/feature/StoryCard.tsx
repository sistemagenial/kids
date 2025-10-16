
interface StoryCardProps {
  story: {
    id: string;
    title: string;
    content: string;
    order_number: number;
    is_new?: boolean;
    image_url?: string;
    testament?: 'old' | 'new';
  };
  onRead: () => void;
  isCompleted?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (storyId: string) => void;
}

export default function StoryCard({ story, onRead, onToggleFavorite, isFavorite, isCompleted }: StoryCardProps) {
  // Usar image_url da história se disponível, senão usar imagem gerada
  const imageUrl = story.image_url || `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28%60beautiful%20childrens%20bible%20story%20illustration%20for%20$%7Bstory.title%7D%2C%20colorful%20and%20vibrant%2C%20child-friendly%20artwork%2C%20simple%20background%2C%20biblical%20scene%2C%20warm%20lighting%2C%20suitable%20for%20children%60%29%7D&width=400&height=300&seq=${story.id}&orientation=landscape`;

  return (
    <div 
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 group cursor-pointer relative"
      onClick={onRead}
    >
      {/* Número da História - Fixo no canto superior esquerdo */}
      <div className="absolute top-3 left-3 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg z-10">
        {story.order_number}
      </div>

      {/* Story Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={story.title}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Faixa NOVIDADE */}
      {story.is_new && (
        <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white text-center py-1 animate-pulse">
          <span className="text-xs font-bold tracking-wider">NOVIDADE</span>
        </div>
      )}

      {/* Conteúdo */}
      <div className="p-4">
        {/* Status e Favorito */}
        <div className="flex items-center justify-between mb-3">
          {/* Status Lido/Não Lido - SEM O CÍRCULO */}
          <div className="flex items-center">
            {isCompleted ? (
              <div className="flex items-center text-green-600 text-xs font-bold">
                <i className="ri-check-circle-fill mr-1"></i>
                <span>LIDO</span>
              </div>
            ) : (
              <div className="flex items-center text-red-500 text-xs font-bold">
                <span>NÃO LIDO</span>
              </div>
            )}
          </div>

          {/* Botão Favoritar */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(story.id);
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
        <h3 className="font-bold text-lg text-gray-800 text-center line-clamp-2 group-hover:text-purple-600 transition-colors">
          {story.title}
        </h3>
      </div>
    </div>
  );
}
