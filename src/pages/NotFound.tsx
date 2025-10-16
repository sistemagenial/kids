
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-5xl font-bold text-purple-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Página não encontrada</h2>
        <p className="text-gray-600 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-home-line mr-2"></i>
            Ir para Início
          </button>
          
          <button
            onClick={handleGoAdmin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-admin-line mr-2"></i>
            Painel Administrativo
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Se você acredita que isso é um erro, entre em contato conosco.</p>
        </div>
      </div>
    </div>
  );
}
