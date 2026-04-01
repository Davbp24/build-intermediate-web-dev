import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiAptana } from "react-icons/di";
import { IoIosArrowDroprightCircle } from "react-icons/io";
import { FaPencil } from "react-icons/fa6";

import './Settings.css';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        className={`toggle ${checked ? 'toggle--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}

interface AccessibilitySettings {
  screenReader: boolean;
  highContrast: boolean;
  immersiveReader: boolean;
}

function Settings() {
  const navigate = useNavigate();

  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    screenReader: false,
    highContrast: false,
    immersiveReader: false,
  });

  const [language, setLanguage] = useState<string>('en-US');

  function updateAccessibility(key: keyof AccessibilitySettings, value: boolean): void {
    setAccessibility(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="settings-screen">

      {/* Top Navigation */}
              <div className="top-bar">
                <div className="logo-container">
                  <div className="logo" aria-label="Logo"><FaPencil /></div>
                  <h1 className="app-name">Inline</h1>
                </div>
                 <div className="nav-buttons">
                  <button onClick={() => navigate('/settings')} className="settings-button"><DiAptana /></button>
                  <button className='back-button' onClick={() => navigate('/')}><IoIosArrowDroprightCircle /></button>
                 </div>
              </div>

      {/* Settings Content */}
      <div className="settings-content">

        <h2 className="settings-title">Global settings</h2>

        {/* Accessibility Section */}
        <section className="settings-section">
          <h3 className="settings-section__heading">Accessibility</h3>
          <div className="settings-group">
            <Toggle
              label="Screen reader"
              checked={accessibility.screenReader}
              onChange={(v) => updateAccessibility('screenReader', v)}
            />
            <Toggle
              label="High contrast"
              checked={accessibility.highContrast}
              onChange={(v) => updateAccessibility('highContrast', v)}
            />
            <Toggle
              label="Immersive reader"
              checked={accessibility.immersiveReader}
              onChange={(v) => updateAccessibility('immersiveReader', v)}
            />
          </div>
        </section>

        {/* Language Section */}
        <div className="settings-row settings-row--language">
          <span className="settings-label settings-label--bold">Language</span>
          <select
            className="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="pt">Português</option>
          </select>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="settings-footer">
        <button className="footer__all-settings" onClick={() => navigate('/settings/all')}>
          <span>All settings</span>
        </button>
      </div>

    </div>
  );
}

export default Settings;