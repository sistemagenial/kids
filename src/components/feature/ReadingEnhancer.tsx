
import { useState, useEffect, useRef } from 'react';

interface ReadingSettings {
  fontSize: number;
}

const fontSizes = [
  { label: 'Pequeno', value: 14 },
  { label: 'Normal', value: 16 },
  { label: 'Grande', value: 18 },
  { label: 'Muito Grande', value: 20 }
];

export default function ReadingEnhancer() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ReadingSettings>({
    fontSize: 16
  });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Carregar configurações salvas
    const savedSettings = localStorage.getItem('reading_enhancer_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const newSettings = { fontSize: parsed.fontSize || 16 };
        setSettings(newSettings);
        applySettings(newSettings);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Fechar modal ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const applySettings = (newSettings: ReadingSettings) => {
    // ✅ CORRIGIDO: Aplicar configurações com múltiplos seletores para garantir compatibilidade
    const selectors = [
      '.story-content',
      '.story-text', 
      '.content-text',
      '.story-content p',
      '.story-text p',
      '.content-text p',
      '.prose',
      '.prose p',
      '.text-gray-700',
      'div[style*="line-height"]',
      '.whitespace-pre-wrap'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element) {
          (element as HTMLElement).style.fontSize = `${newSettings.fontSize}px`;
          (element as HTMLElement).style.lineHeight = '1.8';
        }
      });
    });

    // ✅ NOVO: Aplicar também a elementos que podem ser adicionados dinamicamente
    setTimeout(() => {
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          if (element) {
            (element as HTMLElement).style.fontSize = `${newSettings.fontSize}px`;
            (element as HTMLElement).style.lineHeight = '1.8';
          }
        });
      });
    }, 100);
  };

  const handleSettingChange = (newSettings: ReadingSettings) => {
    setSettings(newSettings);
    localStorage.setItem('reading_enhancer_settings', JSON.stringify(newSettings));
    applySettings(newSettings);
  };

  const handleFontSizeChange = (fontSize: number) => {
    const newSettings = { fontSize };
    handleSettingChange(newSettings);
    
    // ✅ CORRIGIDO: Forçar aplicação imediata
    setTimeout(() => {
      applySettings(newSettings);
    }, 50);
  };

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={toggleModal}
        className="fixed bottom-6 left-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 hover:scale-110 font-bold text-sm whitespace-nowrap"
      >
        LEITURA+
      </button>

      {/* Modal de configurações - simplificado */}
      {isOpen && (
        <div className="fixed bottom-20 left-6 z-50">
          <div 
            ref={modalRef}
            className="bg-white rounded-xl p-4 w-64 shadow-2xl border-2 border-purple-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <i className="ri-font-size-2 mr-2 text-blue-600"></i>
                Tamanho da Fonte
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="space-y-3">
              {/* Tamanho da Fonte */}
              <div className="grid grid-cols-2 gap-2">
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => handleFontSizeChange(size.value)}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 text-sm font-medium hover:scale-105 cursor-pointer ${
                      settings.fontSize === size.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105'
                        : 'border-gray-200 hover:border-blue-300 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
