
import { useState, useEffect } from 'react';
import Button from '../base/Button';
import Card from '../base/Card';

interface ReadingSettings {
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  lineHeight: number;
  autoScroll: boolean;
  autoScrollSpeed: number;
}

interface ReadingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultSettings: ReadingSettings = {
  fontSize: 16,
  fontFamily: 'Arial',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  lineHeight: 1.6,
  autoScroll: false,
  autoScrollSpeed: 50
};

export default function ReadingSettingsModal({ isOpen, onClose }: ReadingSettingsModalProps) {
  const [settings, setSettings] = useState<ReadingSettings>(defaultSettings);

  useEffect(() => {
    // Carregar configurações salvas
    const savedSettings = localStorage.getItem('reading_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar configurações de leitura:', error);
      }
    }
  }, []);

  const handleSave = () => {
    // Salvar configurações no localStorage
    localStorage.setItem('reading_settings', JSON.stringify(settings));
    
    // Aplicar configurações globalmente
    applyGlobalSettings(settings);
    
    alert('Configurações de leitura salvas com sucesso!');
    onClose();
  };

  const applyGlobalSettings = (newSettings: ReadingSettings) => {
    // Aplicar configurações no documento
    const root = document.documentElement;
    root.style.setProperty('--reading-font-size', `${newSettings.fontSize}px`);
    root.style.setProperty('--reading-font-family', newSettings.fontFamily);
    root.style.setProperty('--reading-bg-color', newSettings.backgroundColor);
    root.style.setProperty('--reading-text-color', newSettings.textColor);
    root.style.setProperty('--reading-line-height', newSettings.lineHeight.toString());
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('reading_settings');
    applyGlobalSettings(defaultSettings);
    alert('Configurações resetadas para o padrão!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center">
              <i className="ri-settings-3-line mr-3 text-blue-600"></i>
              Configurações de Leitura
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>

          <div className="space-y-6">
            {/* Tamanho da Fonte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho da Fonte: {settings.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="24"
                value={settings.fontSize}
                onChange={(e) => setSettings({...settings, fontSize: Number(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Pequeno (12px)</span>
                <span>Grande (24px)</span>
              </div>
            </div>

            {/* Família da Fonte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Fonte
              </label>
              <select
                value={settings.fontFamily}
                onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
              >
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
              </select>
            </div>

            {/* Espaçamento entre Linhas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Espaçamento entre Linhas: {settings.lineHeight}
              </label>
              <input
                type="range"
                min="1.2"
                max="2.5"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => setSettings({...settings, lineHeight: Number(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Compacto (1.2)</span>
                <span>Espaçado (2.5)</span>
              </div>
            </div>

            {/* Cor de Fundo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor de Fundo
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSettings({...settings, backgroundColor: '#ffffff', textColor: '#000000'})}
                  className={`w-12 h-12 bg-white border-2 rounded-lg ${settings.backgroundColor === '#ffffff' ? 'border-blue-500' : 'border-gray-300'}`}
                  title="Branco"
                ></button>
                <button
                  onClick={() => setSettings({...settings, backgroundColor: '#f5f5dc', textColor: '#000000'})}
                  className={`w-12 h-12 border-2 rounded-lg ${settings.backgroundColor === '#f5f5dc' ? 'border-blue-500' : 'border-gray-300'}`}
                  style={{ backgroundColor: '#f5f5dc' }}
                  title="Bege"
                ></button>
                <button
                  onClick={() => setSettings({...settings, backgroundColor: '#2d3748', textColor: '#ffffff'})}
                  className={`w-12 h-12 bg-gray-800 border-2 rounded-lg ${settings.backgroundColor === '#2d3748' ? 'border-blue-500' : 'border-gray-300'}`}
                  title="Escuro"
                ></button>
                <button
                  onClick={() => setSettings({...settings, backgroundColor: '#1a202c', textColor: '#e2e8f0'})}
                  className={`w-12 h-12 bg-gray-900 border-2 rounded-lg ${settings.backgroundColor === '#1a202c' ? 'border-blue-500' : 'border-gray-300'}`}
                  title="Muito Escuro"
                ></button>
              </div>
            </div>

            {/* Rolagem Automática */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="autoScroll"
                  checked={settings.autoScroll}
                  onChange={(e) => setSettings({...settings, autoScroll: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoScroll" className="text-sm font-medium text-gray-700">
                  Rolagem Automática
                </label>
              </div>
              
              {settings.autoScroll && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Velocidade da Rolagem: {settings.autoScrollSpeed}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.autoScrollSpeed}
                    onChange={(e) => setSettings({...settings, autoScrollSpeed: Number(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Lenta (10%)</span>
                    <span>Rápida (100%)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prévia
              </label>
              <div 
                className="p-4 border rounded-lg"
                style={{
                  fontSize: `${settings.fontSize}px`,
                  fontFamily: settings.fontFamily,
                  backgroundColor: settings.backgroundColor,
                  color: settings.textColor,
                  lineHeight: settings.lineHeight
                }}
              >
                <p>
                  Esta é uma prévia de como o texto aparecerá com suas configurações. 
                  As histórias bíblicas ficarão mais fáceis de ler com essas personalizações.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6 border-t border-gray-200 mt-6">
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 whitespace-nowrap"
            >
              <i className="ri-save-line mr-2"></i>
              Salvar Configurações
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
              className="flex-1 py-3 whitespace-nowrap"
            >
              <i className="ri-refresh-line mr-2"></i>
              Resetar
            </Button>
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1 py-3 whitespace-nowrap"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
