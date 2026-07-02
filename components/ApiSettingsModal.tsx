import React, { useState, useEffect } from 'react';
import { getStoredConfig, DEFAULT_MODEL } from '../services/mistralService';

interface ApiSettingsModalProps {
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const config = getStoredConfig();
    setApiKey(config.apiKey);
    if (config.model) setModel(config.model);
  }, []);

  const handleSave = () => {
    localStorage.setItem('mistral_api_config', JSON.stringify({ apiKey, model }));
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 border border-blue-500/50 rounded-lg shadow-xl w-full max-w-md m-4 p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-gray-700 pb-2">
          <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            AI 交互设置
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-sm text-gray-300 font-semibold">Mistral API Key</label>
          <input 
            type="password" 
            value={apiKey} 
            onChange={e => setApiKey(e.target.value)} 
            placeholder="输入你的 Mistral API Key"
            className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
          <p className="text-xs text-gray-500">API Key 将安全地保存在您的浏览器本地，不会上传到其他服务器。</p>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-sm text-gray-300 font-semibold">模型选择</label>
          <select 
            value={model} 
            onChange={e => setModel(e.target.value)}
            className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="mistral-small-latest">mistral-small-latest (推荐, 快速响应)</option>
            <option value="mistral-medium-latest">mistral-medium-latest (能力均衡)</option>
            <option value="mistral-large-latest">mistral-large-latest (最强推理)</option>
            <option value="open-mistral-nemo">open-mistral-nemo (开源模型)</option>
            <option value="open-mixtral-8x22b">open-mixtral-8x22b (开源专家模型)</option>
          </select>
          <p className="text-xs text-gray-500">不同的模型消耗的 API 额度和响应速度不同。</p>
        </div>

        <div className="flex justify-end mt-4 items-center gap-4">
          {saved && <span className="text-green-400 text-sm animate-fade-in">保存成功！</span>}
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors shadow-lg"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};
