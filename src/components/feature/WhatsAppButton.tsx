
import Button from '../base/Button';

interface WhatsAppButtonProps {
  message?: string;
  className?: string;
}

export default function WhatsAppButton({ 
  message = 'Olá! Preciso de ajuda com o Profeta de Deus Kids',
  className = ''
}: WhatsAppButtonProps) {
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5517997815756?text=${encodedMessage}`; // ✅ CORRIGIDO: Número atualizado
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <Button
        onClick={handleWhatsAppClick}
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-3 sm:px-4 py-2 sm:py-3 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 border-2 border-green-300/50 whitespace-nowrap text-xs sm:text-sm"
      >
        <i className="ri-whatsapp-line mr-1 sm:mr-2 text-sm sm:text-lg"></i>
        {/* ✅ CORREÇÃO: Texto "FALE CONOSCO" em ambas as versões */}
        <span>FALE CONOSCO</span>
      </Button>
    </div>
  );
}
