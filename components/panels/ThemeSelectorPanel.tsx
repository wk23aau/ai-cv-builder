
import React from 'react';
import { ThemeOptions } from '../../types';
import { AVAILABLE_THEMES } from '../../constants';

interface ThemeSelectorPanelProps {
  currentTheme: ThemeOptions;
  onThemeChange: (theme: ThemeOptions) => void;
  onThemeOptionChange: <K extends keyof ThemeOptions>(option: K, value: ThemeOptions[K]) => void;
}

const ThemeSelectorPanel: React.FC<ThemeSelectorPanelProps> = ({ currentTheme, onThemeChange, onThemeOptionChange }) => {
  const commonInputClass = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";

  const tailwindColorOptions = [
    'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow',
    'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
  ];
  const colorWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
  const fontFamilies = [
      {name: 'Sans Serif', value: 'font-sans'},
      {name: 'Serif', value: 'font-serif'},
      {name: 'Monospace', value: 'font-mono'}
  ];

  return (
    <div className="p-4 space-y-6 bg-white rounded-lg shadow">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Predefined Themes</h3>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_THEMES.map(theme => (
            <button
              key={theme.name}
              onClick={() => onThemeChange(theme.options)}
              className={`p-2 rounded-md text-sm border-2 ${
                currentTheme.primaryColor === theme.options.primaryColor && currentTheme.fontFamily === theme.options.fontFamily
                  ? `border-${theme.options.primaryColor} ring-2 ring-${theme.options.primaryColor} bg-${theme.options.primaryColor} bg-opacity-10`
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <span style={{ color: theme.options.primaryColor.includes('-') ? undefined : theme.options.primaryColor }} className={`font-semibold text-${theme.options.primaryColor}`}>{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Customize Theme</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="primaryColor" className={commonLabelClass}>Primary Color (e.g., blue-600)</label>
            <div className="flex gap-2">
                <select 
                    value={currentTheme.primaryColor.split('-')[0]}
                    onChange={(e) => onThemeOptionChange('primaryColor', `${e.target.value}-${currentTheme.primaryColor.split('-')[1] || '600'}`)}
                    className={commonInputClass + " w-2/3"}
                >
                    {tailwindColorOptions.map(color => <option key={color} value={color}>{color}</option>)}
                </select>
                <select 
                    value={currentTheme.primaryColor.split('-')[1] || '600'}
                    onChange={(e) => onThemeOptionChange('primaryColor', `${currentTheme.primaryColor.split('-')[0]}-${e.target.value}`)}
                    className={commonInputClass + " w-1/3"}
                >
                    {colorWeights.map(weight => <option key={weight} value={weight}>{weight}</option>)}
                </select>
            </div>
          </div>

          <div>
            <label htmlFor="fontFamily" className={commonLabelClass}>Font Family</label>
            <select
              id="fontFamily"
              value={currentTheme.fontFamily}
              onChange={(e) => onThemeOptionChange('fontFamily', e.target.value)}
              className={commonInputClass}
            >
              {fontFamilies.map(font => <option key={font.value} value={font.value}>{font.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="previewScale" className={commonLabelClass}>Preview Zoom ({Math.round((currentTheme.previewScale || 1) * 100)}%)</label>
            <input
                type="range"
                id="previewScale"
                min="0.5" max="1.5" step="0.05"
                value={currentTheme.previewScale || 1}
                onChange={(e) => onThemeOptionChange('previewScale', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelectorPanel;