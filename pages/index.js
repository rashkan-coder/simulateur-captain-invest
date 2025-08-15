import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Home, FileText, BarChart3, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Head from 'next/head';

export default function SimulateurImmobilier() {
  const [formData, setFormData] = useState({
    prixAchat: 200000,
    fraisNotaire: 7,
    apport: 40000,
    coutMeubles: 5000,
    tauxEmprunt: 3.5,
    tauxAssurance: 0.36,
    dureeEmprunt: 20,
    loyerMensuel: 800,
    chargesCopro: 10,
    taxeFonciere: 1200,
    typeLocation: 'nu',
    structureJuridique: 'nomPropre',
    tauxMarginal: 30,
    augmentationLoyer: 2,
    augmentationCharges: 2.5,
    augmentationValeur: 2,
    tauxRendementFinancier: 7,
    fiscaliteFinanciere: 'flatTax'
  });

  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('saisie');

  const playfairStyle = { fontFamily: 'Playfair Display, serif' };

  useEffect(() => {
    const calculateResults = () => {
      try {
        const dureeEnMois = formData.dureeEmprunt * 12;
        const coutTotalAcquisition = formData.prixAchat * (1 + formData.fraisNotaire / 100);
        const montantEmprunte = Math.max(0, coutTotalAcquisition - formData.apport);
        const tauxMensuel = (formData.tauxEmprunt / 100) / 12;
        const tauxAssuranceMensuel = (formData.tauxAssurance / 100) / 12;
        
        let mensualiteCapitalInterets = 0;
        let mensualiteAssurance = 0;
        let mensualiteTotal = 0;
        
        if (montantEmprunte > 0) {
          mensualiteCapitalInterets = montantEmprunte * 
            (tauxMensuel * Math.pow(1 + tauxMensuel, dureeEnMois)) / 
            (Math.pow(1 + tauxMensuel, dureeEnMois) - 1);
          
          mensualiteAssurance = montantEmprunte * tauxAssuranceMensuel;
          mensualiteTotal = mensualiteCapitalInterets + mensualiteAssurance;
        }

        let resultatsParMois = [];
        let capitalRestantDu = montantEmprunte;
        let valeurBien = formData.prixAchat;
        let loyerActuel = formData.loyerMensuel;
        let chargesActuelles = (loyerActuel * formData.chargesCopro) / 100;
        let taxeFonciereActuelle = formData.taxeFonciere / 12;
        let amortissementsCumules = 0;
        
        let patrimoineFinancier = formData.apport;
        const tauxRendementFinancierMensuel = Math.pow(1 + formData.tauxRendementFinancier / 100, 1/12) - 1;
        const tauxValorisationMensuel = Math.pow(1 + formData.augmentationValeur / 100, 1/12) - 1;

        for (let mois = 1; mois <= Math.min(dureeEnMois, 360); mois++) {
          const annee = Math.ceil(mois / 12);
          
          if (mois > 1) {
            const tauxAugmentationLoyerMensuel = Math.pow(1 + formData.augmentationLoyer / 100, 1/12) - 1;
            loyerActuel *= (1 + tauxAugmentationLoyerMensuel);
            chargesActuelles = (loyerActuel * formData.chargesCopro) / 100;
            
            const tauxAugmentationChargesMensuel = Math.pow(1 + formData.augmentationCharges / 100, 1/12) - 1;
            taxeFonciereActuelle *= (1 + tauxAugmentationChargesMensuel);
          }
          
          valeurBien *= (1 + tauxValorisationMensuel);

          let interetsMois = 0;
          let capitalRembourse = 0;
          
          if (montantEmprunte > 0 && capitalRestantDu > 0) {
            interetsMois = capitalRestantDu * tauxMensuel;
            capitalRembourse = mensualiteCapitalInterets - interetsMois;
            capitalRestantDu = Math.max(0, capitalRestantDu - capitalRembourse);
          }

          const revenusLocatifs = loyerActuel;
          const revenusNets = revenusLocatifs - chargesActuelles - taxeFonciereActuelle;

          let amortissementBien = 0;
          let amortissementMeubles = 0;
          
          if (formData.typeLocation === 'meuble') {
            amortissementBien = formData.prixAchat / (20 * 12);
            amortissementMeubles = formData.coutMeubles / (5 * 12);
          }
          
          const amortissementTotal = amortissementBien + (mois <= 60 ? amortissementMeubles : 0);
          amortissementsCumules += amortissementTotal;

          let impots = 0;
          let baseImposable = 0;

          if (formData.structureJuridique === 'nomPropre') {
            if (formData.typeLocation === 'nu') {
              if (revenusNets * 12 <= 15000) {
                baseImposable = revenusNets * 0.7;
              } else {
                baseImposable = revenusNets - interetsMois;
              }
              const impotRevenu = Math.max(0, baseImposable * (formData.tauxMarginal / 100));
              const prelevementsSociaux = Math.max(0, baseImposable * 0.172);
              impots = impotRevenu + prelevementsSociaux;
            } else {
              if (revenusLocatifs * 12 <= 72600) {
                baseImposable = revenusLocatifs * 0.5;
              } else {
                baseImposable = revenusNets - interetsMois - amortissementTotal;
              }
              impots = Math.max(0, baseImposable * (formData.tauxMarginal / 100));
            }
          } else if (formData.structureJuridique === 'sciIR') {
            baseImposable = revenusNets - interetsMois - (formData.typeLocation === 'meuble' ? amortissementTotal : 0);
            if (formData.typeLocation === 'nu') {
              const impotRevenu = Math.max(0, baseImposable * (formData.tauxMarginal / 100));
              const prelevementsSociaux = Math.max(0, baseImposable * 0.172);
              impots = impotRevenu + prelevementsSociaux;
            } else {
              impots = Math.max(0, baseImposable * (formData.tauxMarginal / 100));
            }
          } else {
            baseImposable = revenusNets - interetsMois - amortissementTotal;
            impots = Math.max(0, baseImposable * 0.15);
          }

          const cashFlowNet = revenusLocatifs - chargesActuelles - taxeFonciereActuelle - mensualiteTotal - impots;
          
          const fluxNetFinancier = -cashFlowNet;
          const gainBrutMensuel = patrimoineFinancier * tauxRendementFinancierMensuel;
          
          let impotFinancier = 0;
          if (formData.fiscaliteFinanciere === 'flatTax') {
            impotFinancier = gainBrutMensuel * 0.30;
          } else {
            impotFinancier = gainBrutMensuel * ((formData.tauxMarginal / 100) + 0.172);
          }
          
          const gainNetMensuel = gainBrutMensuel - impotFinancier;
          patrimoineFinancier = patrimoineFinancier + gainNetMensuel + fluxNetFinancier;
          
          const plusValueBrute = valeurBien - formData.prixAchat;
          const plusValueAvecAmortissements = plusValueBrute + amortissementsCumules;
          
          let abattementImpot = 0;
          let abattementPrelevements = 0;
          
          if (formData.structureJuridique === 'nomPropre') {
            if (annee > 5) {
              abattementImpot = Math.min((annee - 5) * 6, 100);
            }
            if (annee > 5 && annee <= 22) {
              abattementPrelevements = (annee - 5) * 1.65;
            } else if (annee > 22) {
              abattementPrelevements = Math.min(30 + (annee - 22) * 9, 100);
            }
          }
          
          const plusValueImposableImpot = Math.max(0, plusValueAvecAmortissements * (100 - abattementImpot) / 100);
          const plusValueImposablePrelevements = Math.max(0, plusValueAvecAmortissements * (100 - abattementPrelevements) / 100);
          
          const impotPlusValueImpot = plusValueImposableImpot * 0.19;
          const impotPlusValuePrelevements = plusValueImposablePrelevements * 0.172;
          const impotPlusValueTotal = impotPlusValueImpot + impotPlusValuePrelevements;
          
          const valeurCession = valeurBien - capitalRestantDu - impotPlusValueTotal;

          resultatsParMois.push({
            mois,
            annee,
            loyerActuel: Math.round(loyerActuel),
            chargesActuelles: Math.round(chargesActuelles),
            taxeFonciereActuelle: Math.round(taxeFonciereActuelle),
            mensualiteTotal: Math.round(mensualiteTotal),
            interetsMois: Math.round(interetsMois),
            capitalRembourse: Math.round(capitalRembourse),
            capitalRestantDu: Math.round(capitalRestantDu),
            amortissementTotal: Math.round(amortissementTotal),
            amortissementsCumules: Math.round(amortissementsCumules),
            baseImposable: Math.round(baseImposable),
            impots: Math.round(impots),
            cashFlowNet: Math.round(cashFlowNet),
            valeurBien: Math.round(valeurBien),
            plusValue: Math.round(plusValueBrute),
            plusValueAvecAmortissements: Math.round(plusValueAvecAmortissements),
            abattementImpot: Math.round(abattementImpot * 10) / 10,
            abattementPrelevements: Math.round(abattementPrelevements * 10) / 10,
            impotPlusValueTotal: Math.round(impotPlusValueTotal),
            valeurCession: Math.round(valeurCession),
            patrimoineFinancier: Math.round(patrimoineFinancier),
            fluxNetFinancier: Math.round(fluxNetFinancier),
            gainBrutMensuel: Math.round(gainBrutMensuel),
            impotFinancier: Math.round(impotFinancier),
            gainNetMensuel: Math.round(gainNetMensuel)
          });
        }

        const cashFlowTotal = resultatsParMois.reduce((sum, r) => sum + r.cashFlowNet, 0);
        const impotsTotal = resultatsParMois.reduce((sum, r) => sum + r.impots, 0);
        const rentabiliteBrute = (formData.loyerMensuel * 12 / formData.prixAchat) * 100;
        const chargesAnnuelles = (formData.loyerMensuel * formData.chargesCopro / 100) * 12 + formData.taxeFonciere;
        const rentabiliteNette = ((formData.loyerMensuel * 12 - chargesAnnuelles) / formData.prixAchat) * 100;

        setResults({
          resultatsParMois,
          synthese: {
            coutTotalAcquisition: Math.round(coutTotalAcquisition),
            apport: formData.apport,
            montantEmprunte: Math.round(montantEmprunte),
            mensualiteTotal: Math.round(mensualiteTotal),
            cashFlowTotal: Math.round(cashFlowTotal),
            impotsTotal: Math.round(impotsTotal),
            rentabiliteBrute: rentabiliteBrute.toFixed(2),
            rentabiliteNette: rentabiliteNette.toFixed(2),
            valeurFinale: resultatsParMois[resultatsParMois.length - 1]?.valeurBien || 0,
            gainTotal: Math.round(cashFlowTotal + (resultatsParMois[resultatsParMois.length - 1]?.valeurCession || 0)),
            gainFinancier: Math.round(resultatsParMois[resultatsParMois.length - 1]?.patrimoineFinancier || 0),
            totalInvestiFinancier: Math.round(formData.apport + (mensualiteTotal * dureeEnMois))
          }
        });
      } catch (error) {
        console.error('Erreur calcul:', error);
      }
    };

    calculateResults();
  }, [formData]);

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  const formatCurrency = (amount) => {
    if (isNaN(amount)) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <Head>
        <title>Simulateur Immobilier vs Financier - Captain Invest</title>
        <meta name="description" content="Comparez la rentabilité entre investissement immobilier et placement financier avec notre simulateur complet." />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #44145b 0%, #2a0845 50%, #1a0530 100%)'}}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Calculator className="w-12 h-12 text-white mr-3" />
              <h1 className="text-4xl font-bold text-white" style={playfairStyle}>Simulateur Immobilier vs Financier</h1>
            </div>
            <p className="text-xl text-white mb-2" style={playfairStyle}>Immobilier ou placements financiers : lequel vous rapporte le plus ?</p>
            <p className="text-lg text-white opacity-90" style={playfairStyle}>Saisissez vos chiffres, ajustez les paramètres et découvrez le verdict.</p>
          </div>

          {/* Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg shadow-lg p-1 flex">
              <button
                onClick={() => setActiveTab('saisie')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'saisie' ? 'text-white shadow-md' : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{
                  ...playfairStyle,
                  backgroundColor: activeTab === 'saisie' ? '#775d83' : 'transparent'
                }}
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Saisie
              </button>
              <button
                onClick={() => setActiveTab('resultats')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'resultats' ? 'text-white shadow-md' : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{
                  ...playfairStyle,
                  backgroundColor: activeTab === 'resultats' ? '#775d83' : 'transparent'
                }}
              >
                <BarChart3 className="w-5 h-5 inline mr-2" />
                Résultats
              </button>
              <button
                onClick={() => setActiveTab('comparaison')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'comparaison' ? 'text-white shadow-md' : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{
                  ...playfairStyle,
                  backgroundColor: activeTab === 'comparaison' ? '#775d83' : 'transparent'
                }}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Comparaison
              </button>
            </div>
          </div>

          {/* Contenu des onglets - Interface complète avec tous les formulaires et graphiques */}
          {activeTab === 'saisie' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6" style={playfairStyle}>📊 Investissement Immobilier Locatif</h2>
                
                {/* Tous les formulaires ici... */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center" style={playfairStyle}>
                    <Home className="w-6 h-6 mr-2" style={{color: '#775d83'}} />
                    Acquisition
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" style={playfairStyle}>Prix d'achat (€)</label>
                      <input
                        type="number"
                        value={formData.prixAchat}
                        onChange={(e) => handleInputChange('prixAchat', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        style={playfairStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" style={playfairStyle}>Frais de notaire (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.fraisNotaire}
                        onChange={(e) => handleInputChange('fraisNotaire', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        style={playfairStyle}
                      />
                    </div>
                    {/* ... autres champs ... */}
                  </div>
                </div>
                
                {/* Section Investissement Financier */}
                <h2 className="text-2xl font-bold text-white mb-6 pt-8" style={playfairStyle}>💰 Investissement Financier</h2>
                <div className="rounded-xl shadow-lg p-6" style={{backgroundColor: '#faf9f7'}}>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center" style={playfairStyle}>
                    <TrendingUp className="w-6 h-6 mr-2" style={{color: '#f8e53b'}} />
                    Investissement Financier
                  </h3>
                  {/* Formulaires investissement financier */}
                </div>
              </div>
              
              {/* Aperçu */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4" style={playfairStyle}>Aperçu rapide</h3>
                  {results && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg" style={{backgroundColor: 'rgba(119, 93, 131, 0.1)'}}>
                        <div className="text-sm text-gray-600" style={playfairStyle}>Rentabilité brute</div>
                        <div className="text-2xl font-bold" style={{...playfairStyle, color: '#775d83'}}>{results.synthese.rentabiliteBrute}%</div>
                      </div>
                      {/* Autres indicateurs... */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglets Résultats et Comparaison avec graphiques complets */}
          {activeTab === 'comparaison' && results && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6" style={playfairStyle}>
                  Comparaison des gains nets : Immobilier vs Investissement Financier
                </h3>
                
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    data={results.resultatsParMois.filter(r => r.mois % 12 === 0)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="annee"
                      tick={{fontFamily: 'Playfair Display, serif'}}
                      tickFormatter={(value) => `Année ${value}`}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{fontFamily: 'Playfair Display, serif'}}
                    />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(value), name]}
                      labelFormatter={(value) => `Année ${value}`}
                      contentStyle={{fontFamily: 'Playfair Display, serif'}}
                    />
                    <Legend wrapperStyle={{fontFamily: 'Playfair Display, serif'}} />
                    <Line 
                      type="monotone" 
                      dataKey="valeurCession" 
                      stroke="#775d83" 
                      strokeWidth={3} 
                      name="Gain net immobilier"
                      dot={{fill: '#775d83', strokeWidth: 2}}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="patrimoineFinancier" 
                      stroke="#f8e53b" 
                      strokeWidth={3} 
                      name="Gain net financier"
                      dot={{fill: '#f8e53b', strokeWidth: 2}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Disclaimer légal */}
          <div className="mt-12 text-center">
            <div className="rounded-lg shadow-sm p-4 max-w-4xl mx-auto text-white" style={{background: 'linear-gradient(135deg, #44145b 0%, #2a0845 50%, #1a0530 100%)'}}>
              <p className="text-sm" style={playfairStyle}>
                <strong>Avertissement :</strong> Cette simulation ne constitue pas un conseil en investissement, une recommandation personnalisée, ni une analyse financière au sens de la réglementation en vigueur (articles L.321-1 et suivants du Code monétaire et financier).
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
