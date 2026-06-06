'use client';

import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

export default function SettingsPage() {
  const {
    t, theme, setTheme, language, setLanguage,
    allExpenseCategories, allIncomeCategories, customExpenseCategories, customIncomeCategories,
    addExpenseCategory, addIncomeCategory, removeExpenseCategory, removeIncomeCategory,
    exportData, importData, clearData,
    companyProfile, updateCompanyProfile,
    geminiApiKey, setGeminiApiKey
  } = useAppContext();

  const [newExpCat, setNewExpCat] = useState('');
  const [newIncCat, setNewIncCat] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => importData(ev.target?.result as string);
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    if (window.confirm(t('set.clearConfirm'))) clearData();
  };

  const sectionStyle = { marginBottom: '24px' };
  const headStyle = { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '14px', display: 'block' };
  const catTagStyle = (isCustom: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500,
    background: isCustom ? 'var(--accent-primary-dim)' : 'rgba(128,128,128,0.08)',
    color: isCustom ? 'var(--accent-primary)' : 'var(--text-secondary)',
    border: '1px solid ' + (isCustom ? 'var(--accent-primary-dim)' : 'transparent'),
  });

  return (
    <>
      <div className="page-header animate-slide-up">
        <div><h1 className="page-title">{t('set.title')}</h1><p className="page-subtitle">{t('set.subtitle')}</p></div>
      </div>

      <div className="page-content" style={{ maxWidth: 720 }}>
        {/* Company Profile */}
        <div className="glass-panel animate-slide-up" style={sectionStyle}>
          <span style={headStyle}>{language === 'id' ? 'Profil Perusahaan' : 'Company Profile'}</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            <div className="form-group">
              <label>{language === 'id' ? 'Nama Perusahaan' : 'Company Name'}</label>
              <input value={companyProfile.name} onChange={e => updateCompanyProfile({ name: e.target.value })} placeholder="KASFLOW COMPANY" />
            </div>
            <div className="form-group">
              <label>{language === 'id' ? 'Alamat' : 'Address'}</label>
              <textarea value={companyProfile.address} onChange={e => updateCompanyProfile({ address: e.target.value })} rows={2} style={{ padding: '10px 14px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'inherit', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={companyProfile.email} onChange={e => updateCompanyProfile({ email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{language === 'id' ? 'No. Telepon' : 'Phone Number'}</label>
                <input value={companyProfile.phone} onChange={e => updateCompanyProfile({ phone: e.target.value })} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{language === 'id' ? '*Data ini akan digunakan sebagai kop surat pada setiap Faktur/Laporan yang Anda cetak.' : '*This data will be used as the letterhead for every Invoice/Report you print.'}</p>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="glass-panel animate-slide-up" style={sectionStyle}>
          <span style={headStyle}>{language === 'id' ? '🤖 Konfigurasi AI' : '🤖 AI Configuration'}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label>Gemini API Key</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={e => setGeminiApiKey(e.target.value)}
                  placeholder={language === 'id' ? 'Masukkan API Key Gemini...' : 'Enter Gemini API Key...'}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-secondary btn-sm" onClick={() => setShowApiKey(!showApiKey)} style={{ flexShrink: 0 }}>
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {geminiApiKey ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>✅ {language === 'id' ? 'API Key sudah diatur' : 'API Key is set'}</span>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-warning)', fontWeight: 600 }}>⚠️ {language === 'id' ? 'API Key belum diatur' : 'API Key not set'}</span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {language === 'id'
                ? '* Dapatkan API Key gratis dari '
                : '* Get a free API Key from '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>aistudio.google.com/apikey</a>
              {language === 'id'
                ? '. API Key ini diperlukan untuk fitur AI Scanner.'
                : '. This API Key is required for the AI Scanner feature.'}
            </p>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass-panel animate-slide-up delay-1" style={sectionStyle}>
          <span style={headStyle}>{t('set.appearance')}</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Theme */}
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>{t('set.theme')}</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['dark', 'light'] as const).map(th => (
                  <button key={th} onClick={() => setTheme(th)} style={{ padding: '10px 20px', borderRadius: '11px', border: `2px solid ${theme === th ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: theme === th ? 'var(--accent-primary-dim)' : 'transparent', color: theme === th ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.875rem', transition: 'all 0.2s' }}>
                    {t(`set.${th === 'dark' ? 'dark' : 'light'}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>{t('set.language')}</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {([['en', '🇺🇸 English'], ['id', '🇮🇩 Indonesia']] as const).map(([lang, label]) => (
                  <button key={lang} onClick={() => setLanguage(lang)} style={{ padding: '10px 20px', borderRadius: '11px', border: `2px solid ${language === lang ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: language === lang ? 'var(--accent-primary-dim)' : 'transparent', color: language === lang ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.875rem', transition: 'all 0.2s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Categories */}
        <div className="glass-panel animate-slide-up delay-2" style={sectionStyle}>
          <span style={headStyle}>{t('set.categories')}</span>

          {/* Expense */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px', color: 'var(--accent-danger)' }}>{t('set.expenseCat')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '10px' }}>
              {allExpenseCategories.map((cat) => {
                const isCustom = customExpenseCategories.includes(cat);
                return (
                  <span key={cat} style={catTagStyle(isCustom)}>
                    {cat}
                    {isCustom && <button onClick={() => removeExpenseCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0 0 0 2px', fontSize: '12px', lineHeight: 1 }}>✕</button>}
                  </span>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={newExpCat} onChange={e => setNewExpCat(e.target.value)} placeholder={t('set.addCatPlaceholder')} onKeyDown={e => { if (e.key === 'Enter' && newExpCat.trim()) { addExpenseCategory(newExpCat.trim()); setNewExpCat(''); } }} style={{ flex: 1 }} />
              <button className="btn btn-secondary btn-sm" onClick={() => { if (newExpCat.trim()) { addExpenseCategory(newExpCat.trim()); setNewExpCat(''); } }}>{t('set.addCat')}</button>
            </div>
          </div>

          {/* Income */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px', color: 'var(--accent-primary)' }}>{t('set.incomeCat')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '10px' }}>
              {allIncomeCategories.map((cat) => {
                const isCustom = customIncomeCategories.includes(cat);
                return (
                  <span key={cat} style={catTagStyle(isCustom)}>
                    {cat}
                    {isCustom && <button onClick={() => removeIncomeCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0 0 0 2px', fontSize: '12px', lineHeight: 1 }}>✕</button>}
                  </span>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={newIncCat} onChange={e => setNewIncCat(e.target.value)} placeholder={t('set.addCatPlaceholder')} onKeyDown={e => { if (e.key === 'Enter' && newIncCat.trim()) { addIncomeCategory(newIncCat.trim()); setNewIncCat(''); } }} style={{ flex: 1 }} />
              <button className="btn btn-secondary btn-sm" onClick={() => { if (newIncCat.trim()) { addIncomeCategory(newIncCat.trim()); setNewIncCat(''); } }}>{t('set.addCat')}</button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="glass-panel animate-slide-up delay-3">
          <span style={headStyle}>{t('set.data')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={exportData}>{t('set.export')}</button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={handleImport}>{t('set.import')}</button>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
            <button className="btn btn-danger" style={{ justifyContent: 'flex-start' }} onClick={handleClear}>{t('set.clear')}</button>
          </div>
        </div>
      </div>
    </>
  );
}
