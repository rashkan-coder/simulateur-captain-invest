import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PatrimoineComparator = () => {
  const [formData, setFormData] = useState({
    // Paramètres Achat
    prixAchat: 300000,
    fraisNotaire: 7.5,
    travaux: 15000,
    apport: 60000,
    tauxEmprunt: 3.5,
    dureeEmprunt: 20,
    taxeFonciere: 1200,
    chargesMensuelles: 150,
    grosTravaux: 0.15,
    
    // Paramètres Location
    loyer: 1400,
    tauxRendement: 3.0,
    
    // Paramètres Fiscalité
    fiscalitePlacement: 30
  });

  const [activeTab, setActiveTab] = useState('saisie');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const calculations = useMemo(() => {
    const { prixAchat, fraisNotaire, travaux, apport, tauxEmprunt, dureeEmprunt, taxeFonciere, chargesMensuelles, grosTravaux, loyer, tauxRendement, fiscalitePlacement } = formData;
    
    const montantEmprunt = prixAchat * (1 + fraisNotaire/100) + travaux - apport;
    const tauxMensuel = tauxEmprunt / 100 / 12;
    const nbMensualites = dureeEmprunt * 12;
    const mensualiteCredit = montantEmprunt * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / (Math.pow(1 + tauxMensuel, nbMensualites) - 1);
    const coutMensuelAchat = mensualiteCredit + taxeFonciere / 12 + chargesMensuelles;
    
    const results = [];
    const valeurBienInitiale = prixAchat + travaux;
    let patrimoineLocationBrut = 0;
    let impotsCumulesLocation = 0;
    let loyerAnnuel = loyer * 12;
    let taxeFonciereAnnuelle = taxeFonciere;
    let placementPostCredit = 0;
    let capitalRestantDu = montantEmprunt;
    let depenseGrosTravaux = 0;
    
    const capitalInitialLocation = apport + travaux + taxeFonciere + (chargesMensuelles * 12);
    patrimoineLocationBrut = capitalInitialLocation;
    
    for (let annee = 1; annee <= 30; annee++) {
      const valeurBien = valeurBienInitiale * Math.pow(1.015, annee);
      loyerAnnuel = loyerAnnuel * 1.015;
      taxeFonciereAnnuelle = taxeFonciereAnnuelle * 1.03;
      
      let coutGrosTravaux = 0;
      if (annee % 10 === 0) {
        coutGrosTravaux = valeurBien * grosTravaux / 100;
        depenseGrosTravaux += coutGrosTravaux;
      }
      
      if (annee <= dureeEmprunt) {
        for (let mois = 1; mois <= 12; mois++) {
          const interetsMois = capitalRestantDu * tauxMensuel;
          const capitalMois = mensualiteCredit - interetsMois;
          capitalRestantDu -= capitalMois;
        }
      }
      
      let coutAnnuelAchat;
      if (annee <= dureeEmprunt) {
        coutAnnuelAchat = mensualiteCredit * 12 + taxeFonciereAnnuelle + chargesMensuelles * 12 + coutGrosTravaux;
      } else {
        coutAnnuelAchat = taxeFonciereAnnuelle + chargesMensuelles * 12 + coutGrosTravaux;
      }
      
      const differentielAnnuel = coutAnnuelAchat - loyerAnnuel;
      const capitalDebutAnnee = patrimoineLocationBrut;
      
      patrimoineLocationBrut = (patrimoineLocationBrut + differentielAnnuel) * (1 + tauxRendement/100);
      
      const gainsAnnee = patrimoineLocationBrut - capitalDebutAnnee - differentielAnnuel;
      const impotAnnee = gainsAnnee * fiscalitePlacement / 100;
      impotsCumulesLocation += impotAnnee;
      
      const patrimoineLocationNet = patrimoineLocationBrut - impotsCumulesLocation;
      
      let patrimoineAchat = valeurBien - Math.max(0, capitalRestantDu) - depenseGrosTravaux;
      
      if (annee > dureeEmprunt) {
        const chargesAchatAnnuelles = taxeFonciereAnnuelle + chargesMensuelles * 12;
        const economieAnnuelle = loyerAnnuel - chargesAchatAnnuelles;
        
        placementPostCredit = (placementPostCredit + economieAnnuelle) * (1 + tauxRendement/100);
        
        patrimoineAchat += placementPostCredit;
      }
      
      results.push({
        annee,
        coutMensuelLocation: Math.round(loyerAnnuel / 12),
        coutMensuelAchat: Math.round(coutAnnuelAchat / 12),
        patrimoineAchat: Math.round(patrimoineAchat),
        patrimoineLocationBrut: Math.round(patrimoineLocationBrut),
        patrimoineLocationNet: Math.round(patrimoineLocationNet),
        impotsCumules: Math.round(impotsCumulesLocation),
        valeurBien: Math.round(valeurBien),
        capitalRestantDu: Math.round(Math.max(0, capitalRestantDu)),
        placementPostCredit: Math.round(placementPostCredit),
        creditFini: annee > dureeEmprunt,
        grosTravaux: Math.round(coutGrosTravaux),
        differentiel: Math.round(differentielAnnuel),
        differentielMensuel: Math.round(differentielAnnuel / 12)
      });
    }
    
    return { results, coutMensuelInitial: Math.round(coutMensuelAchat) };
  }, [formData]);

  const formatEuro = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen p-4" style={{ 
      backgroundColor: '#340849',
      fontFamily: 'Playfair Display, serif'
    }}>
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-8 h-8 text-white">📊</div>
            <h1 className="text-4xl font-bold text-white">Comparateur Patrimoine</h1>
          </div>
          <p className="text-xl text-white mb-8">Achat vs Location - Quelle stratégie optimise votre patrimoine ?</p>
          
          <div className="bg-white rounded-2xl shadow-xl p-2 mb-8">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('saisie')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  activeTab === 'saisie' 
                    ? 'text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                style={activeTab === 'saisie' ? { backgroundColor: '#340849' } : {}}
              >
                Saisie
              </button>
              <button
                onClick={() => setActiveTab('resultats')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  activeTab === 'resultats' 
                    ? 'text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                style={activeTab === 'resultats' ? { backgroundColor: '#340849' } : {}}
              >
                Résultats
              </button>
            </div>
          </div>
        </header>

        {activeTab === 'saisie' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-6 h-6 text-green-600">🏠</span>
                <h2 className="text-2xl font-semibold text-gray-800">Paramètres Achat</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat (€)</label>
                  <input
                    type="number"
                    value={formData.prixAchat}
                    onChange={(e) => handleInputChange('prixAchat', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frais de notaire (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.fraisNotaire}
                    onChange={(e) => handleInputChange('fraisNotaire', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Travaux à l'acquisition (€)</label>
                  <input
                    type="number"
                    value={formData.travaux}
                    onChange={(e) => handleInputChange('travaux', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apport personnel (€)</label>
                  <input
                    type="number"
                    value={formData.apport}
                    onChange={(e) => handleInputChange('apport', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux d'emprunt (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tauxEmprunt}
                    onChange={(e) => handleInputChange('tauxEmprunt', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée d'emprunt (années)</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={formData.dureeEmprunt}
                    onChange={(e) => handleInputChange('dureeEmprunt', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taxe foncière annuelle (€)</label>
                  <input
                    type="number"
                    value={formData.taxeFonciere}
                    onChange={(e) => handleInputChange('taxeFonciere', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Charges mensuelles (€)</label>
                  <input
                    type="number"
                    value={formData.chargesMensuelles}
                    onChange={(e) => handleInputChange('chargesMensuelles', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gros travaux (% valeur / 10 ans)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.grosTravaux}
                    onChange={(e) => handleInputChange('grosTravaux', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-6 h-6 text-blue-600">📈</span>
                <h2 className="text-2xl font-semibold text-gray-800">Paramètres Location</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loyer mensuel (€)</label>
                  <input
                    type="number"
                    value={formData.loyer}
                    onChange={(e) => handleInputChange('loyer', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux de rendement (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tauxRendement}
                    onChange={(e) => handleInputChange('tauxRendement', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux d'impôt sur les plus-values financières (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.fiscalitePlacement}
                    onChange={(e) => handleInputChange('fiscalitePlacement', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-semibold"
style={{ color: '#1f2937' }}
                  />
                  <p className="text-xs text-gray-600 mt-1">Tenir compte des différentes enveloppes fiscales (PEA, Assurance-Vie, etc.)</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl shadow-xl p-6" style={{ backgroundColor: '#dedddf' }}>
              <h3 className="font-semibold text-gray-800 mb-4 text-xl">Hypothèses de calcul</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Augmentation valeur immobilière : +1,5% par an</li>
                  <li>• Augmentation loyer : +1,5% par an</li>
                  <li>• Augmentation taxe foncière : +3% par an</li>
                  <li>• Gros travaux : tous les 10 ans</li>
                </ul>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Capital initial location = apport + travaux + taxe foncière + charges (1ère année)</li>
                  <li>• Résidence principale : pas d'impôt sur plus-values immobilières</li>
                  <li>• Fiscalité appliquée uniquement sur les gains financiers</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Les résultats Achat vs Location</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#c9b6e8' }}>
                  <h3 className="font-semibold text-gray-800 mb-2">Coût mensuel Achat</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatEuro(calculations.coutMensuelInitial)}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f6dd38' }}>
                  <h3 className="font-semibold text-gray-800 mb-2">Coût mensuel Location</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatEuro(formData.loyer)}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#d6d5d6' }}>
                  <h3 className="font-semibold text-gray-800 mb-2">Différentiel initial</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatEuro(calculations.coutMensuelInitial - formData.loyer)}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Patrimoine à 30 ans - Achat</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatEuro(calculations.results[29]?.patrimoineAchat || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#e3f2fd' }}>
                  <h3 className="font-semibold mb-2" style={{ color: '#0505e3' }}>Patrimoine à 30 ans - Location (Net)</h3>
                  <p className="text-2xl font-bold" style={{ color: '#0505e3' }}>
                    {formatEuro(calculations.results[29]?.patrimoineLocationNet || 0)}
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#0505e3', opacity: 0.7 }}>
                    Après impôts sur les plus-values
                  </p>
                </div>
              </div>
              
              <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Avantage final (30 ans)</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {calculations.results[29] && formatEuro(calculations.results[29].patrimoineAchat - calculations.results[29].patrimoineLocationNet)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Évolution du Patrimoine Net (Avant Impôt)</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calculations.results}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="annee" />
                    <YAxis tickFormatter={(value) => `${Math.round(value/1000)}k€`} />
                    <Tooltip 
                      formatter={(value) => [formatEuro(value), '']}
                      labelFormatter={(label) => `Année ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="patrimoineAchat" 
                      stroke="#340849" 
                      strokeWidth={3}
                      name="Patrimoine Brut Achat"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="patrimoineLocationBrut" 
                      stroke="#0505e3" 
                      strokeWidth={3}
                      name="Patrimoine Brut Location"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl shadow-xl p-6" style={{ backgroundColor: '#f6f2fa' }}>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Évolution du Patrimoine Net (Après Impôt)</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calculations.results}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="annee" />
                    <YAxis tickFormatter={(value) => `${Math.round(value/1000)}k€`} />
                    <Tooltip 
                      formatter={(value) => [formatEuro(value), '']}
                      labelFormatter={(label) => `Année ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="patrimoineAchat" 
                      stroke="#340849" 
                      strokeWidth={3}
                      name="Patrimoine Net Achat"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="patrimoineLocationNet" 
                      stroke="#0505e3" 
                      strokeWidth={3}
                      name="Patrimoine Net Location"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Détail par Année</h2>
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left font-semibold">Année</th>
                      <th className="px-3 py-2 text-right font-semibold">Différentiel mensuel</th>
                      <th className="px-3 py-2 text-right font-semibold">Patrimoine Achat</th>
                      <th className="px-3 py-2 text-right font-semibold">Patrimoine Location (Net)</th>
                      <th className="px-3 py-2 text-right font-semibold">Avantage Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.results.map((row, index) => {
                      const avantageNet = row.patrimoineAchat - row.patrimoineLocationNet;
                      return (
                        <tr key={row.annee} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-3 py-2 font-medium">{row.annee}</td>
                          <td className="px-3 py-2 text-right text-purple-600 font-semibold">
                            {formatEuro(row.differentielMensuel)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold" style={{ color: '#340849' }}>
                            {formatEuro(row.patrimoineAchat)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold" style={{ color: '#0505e3' }}>
                            {formatEuro(row.patrimoineLocationNet)}
                          </td>
                          <td className={`px-3 py-2 text-right font-semibold ${avantageNet > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {avantageNet > 0 ? '+' : ''}{formatEuro(avantageNet)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center mt-12 mb-8">
          <p className="text-xs text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Cette simulation ne constitue pas un conseil en investissement, une recommandation personnalisée, ni une analyse financière au sens de la réglementation en vigueur (articles L.321-1 et suivants du Code monétaire et financier).
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatrimoineComparator;
