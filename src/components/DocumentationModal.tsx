import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Compass,
  FolderKanban,
  GitBranch,
  Cloud,
  Sparkles,
  PieChart,
  ArrowRightLeft,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  HelpCircle,
} from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DocSectionId = 'overview' | 'projects' | 'tabs' | 'github' | 'cloud' | 'faq';

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<DocSectionId>('overview');

  if (!isOpen) return null;

  const sections: { id: DocSectionId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Vue Générale', icon: Compass },
    { id: 'projects', label: 'Projets & Reports', icon: FolderKanban },
    { id: 'tabs', label: 'Les 7 Onglets', icon: PieChart },
    { id: 'github', label: 'Mise à jour GitHub', icon: GitBranch },
    { id: 'cloud', label: 'Cloud & Sécurité', icon: Cloud },
    { id: 'faq', label: 'Astuces & FAQ', icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white text-slate-800 p-4 sm:p-5 flex justify-between items-center border-b border-emerald-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center shadow-2xs">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">Documentation & Guide LexBudget</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                  v1.4.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Manuel complet d&apos;utilisation, méthode 50/30/20 et synchronisation GitHub
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200/80 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100/70 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          {activeSection === 'overview' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <h4 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Philosophie LexBudget (Méthode 50 / 30 / 20)</span>
                </h4>
                <p className="text-emerald-900 text-xs">
                  LexBudget répartit votre revenu disponible en trois enveloppes claires pour garantir votre équilibre financier tout en automatisant votre épargne :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">50% Besoins</span>
                    <p className="font-bold text-slate-900 mt-0.5">Charges vitales & fixes</p>
                    <p className="text-[11px] text-slate-500 mt-1">Loyer, alimentation, factures STEG/SONEDE, transport, santé.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-extrabold uppercase text-amber-600">30% Envies</span>
                    <p className="font-bold text-slate-900 mt-0.5">Plaisirs & style de vie</p>
                    <p className="text-[11px] text-slate-500 mt-1">Restaurants, cafés, sorties, shopping, loisirs et abonnements.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-600">20% Épargne</span>
                    <p className="font-bold text-slate-900 mt-0.5">Sécurité & projets</p>
                    <p className="text-[11px] text-slate-500 mt-1">Fonds d&apos;urgence, investissements, objectifs long terme.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-sm font-bold text-slate-900">Indicateurs du Tableau de Bord</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Revenu Disponible :</span> Inclut votre revenu fixe mensuel + les revenus exceptionnels ajoutés + le report global éventuel du mois précédent.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Safe-to-Spend Quotidien (~X TND/j) :</span> Affiché dans la carte <em>Reste à Vivre</em>, il divise votre solde restant par le nombre de jours restants dans le mois pour vous indiquer votre budget journalier sans risque de dépassement.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Bouton Flottant (+) :</span> Accessible en bas à droite sur tous les écrans pour saisir une dépense ou un revenu en 3 secondes avec vos préréglages favoris.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'projects' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-emerald-600" />
                  <span>Gestion Multi-Projets (Mois & Périodes)</span>
                </h4>
                <p>
                  Chaque mois (ex. <strong>Août 2026</strong>, <strong>Septembre 2026</strong>) fonctionne comme un projet indépendant avec ses propres enveloppes et transactions :
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>
                    <strong>Bouton &laquo; Projets &raquo; :</strong> Ouvre la vue d&apos;ensemble de tous vos mois créés ou archivés pour comparer vos revenus, dépenses et soldes nets.
                  </li>
                  <li>
                    <strong>Bouton &laquo; + Nouveau &raquo; :</strong> Permet de créer une nouvelle période mensuelle tout en archivant proprement le mois en cours.
                  </li>
                  <li>
                    <strong>Bascule instantanée :</strong> Cliquez sur n&apos;importe quel mois dans la barre supérieure pour consulter ou modifier ses opérations à tout moment.
                  </li>
                </ul>
              </div>

              <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 space-y-2">
                <h4 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                  <span>Système de Report Budgétaire (Rollover)</span>
                </h4>
                <p className="text-teal-900">
                  Grâce au bouton <strong>&laquo; Report postes &raquo;</strong>, vous pouvez transférer les reliquats non dépensés (ou les dépassements) d&apos;un mois précédent vers les postes du mois actif :
                </p>
                <ul className="list-disc pl-5 space-y-1 text-teal-800">
                  <li>Sélectionnez la période source (ex. le mois dernier).</li>
                  <li>Cochez uniquement les postes que vous souhaitez reporter (ex. <em>Alimentation</em> ou <em>Carburant</em>).</li>
                  <li>Le budget disponible du poste devient automatiquement : <strong>Prévu + Report</strong>.</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'tabs' && (
            <div className="space-y-3">
              {[
                {
                  title: '1. Plan (Planification & Charges Fixes)',
                  desc: 'Choisissez votre stratégie (50/30/20, Épargne Intensive, Frugal ou Personnalisé), gérez vos plafonds par poste et payez vos charges fixes mensuelles en 1 clic.',
                },
                {
                  title: '2. Suivi (Transactions & Portefeuilles)',
                  desc: 'Suivez vos soldes réels par portefeuille (Espèces, Compte bancaire, Carte), effectuez des virements internes et filtrez vos dépenses.',
                },
                {
                  title: '3. Objectifs (Cagnottes d’Épargne)',
                  desc: 'Définissez vos projets financiers avec date cible. L’application calcule l’effort mensuel requis et permet de verser des contributions directes.',
                },
                {
                  title: '4. Analyses (Graphiques & Rythme Quotidien)',
                  desc: 'Consultez votre score d’efficience (/100), la courbe du rythme quotidien des dépenses, la répartition 50/30/20 et le comparatif Prévu vs Réel.',
                },
                {
                  title: '5. Activités (Journal Global)',
                  desc: 'Recherchez n’importe quelle opération sur le mois actif ou sur l’ensemble de vos projets, et consultez l’historique des actions IA.',
                },
                {
                  title: '6. Conseiller IA',
                  desc: 'Discutez avec votre coach financier pour obtenir des recommandations personnalisées et appliquer des ajustements budgétaires en un clic.',
                },
                {
                  title: '7. Audit IA & Simulateur "What-If"',
                  desc: 'Lancez un audit complet de votre budget et utilisez les curseurs du simulateur "What-If" pour calculer combien vous économiseriez sur 1 mois et sur 1 an.',
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="font-bold text-slate-900">{item.title}</p>
                  <p className="text-slate-600 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'github' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 text-slate-800 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-600" />
                  <span>Synchronisation des Mises à Jour avec GitHub</span>
                </h4>
                <p className="text-emerald-950/80">
                  Lorsque vous utilisez l&apos;application localement sur votre téléphone, le bouton <strong>Update</strong> de l&apos;en-tête vérifie si de nouvelles modifications ont été publiées sur GitHub ou sur le serveur.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h5 className="font-bold text-slate-900">Comment fonctionne le bouton &laquo; Check Update &raquo; ?</h5>
                <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                  <li>
                    <strong>Configuration du dépôt :</strong> Dans la fenêtre <em>Mises à Jour (GitHub)</em>, renseignez votre dépôt sous la forme <code>proprietaire/nom-du-repo</code> et la branche (ex. <code>main</code>).
                  </li>
                  <li>
                    <strong>Vérification intelligente :</strong> L&apos;application interroge l&apos;API GitHub (en passant par le serveur ou directement depuis votre téléphone) et compare le dernier identifiant de commit (SHA) avec celui installé sur votre appareil.
                  </li>
                  <li>
                    <strong>Mise à jour sans perte de données :</strong> Si une nouveauté est détectée, cliquez sur <strong>Mettre à jour maintenant</strong>. Vos projets et transactions sont automatiquement sauvegardés, le cache obsolète est purgé et la nouvelle version est chargée immédiatement.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'cloud' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Protection & Synchronisation Multi-Appareils</span>
                </h4>
                <p className="text-emerald-900">
                  Vos données financières sont protégées par trois niveaux de sécurité complémentaires :
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-emerald-900 mt-2">
                  <li>
                    <strong>Stockage Local Immédiat :</strong> Fonctionne 100% hors-ligne sur votre téléphone.
                  </li>
                  <li>
                    <strong>Synchronisation Cloud Firebase :</strong> Connectez votre compte via le bouton <em>Cloud</em> pour synchroniser automatiquement vos projets entre votre smartphone et votre ordinateur.
                  </li>
                  <li>
                    <strong>Sauvegardes Automatiques (12h) :</strong> Un point de restauration local est créé toutes les 12 heures et avant chaque mise à jour (accessible depuis le menu <em>Sauvegardes & Restauration</em>).
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'faq' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Comment installer l&apos;application sur l&apos;écran d&apos;accueil de mon téléphone ?</span>
                </p>
                <p className="text-slate-600 mt-1">
                  Ouvrez le menu en haut à droite $\rightarrow$ <strong>Installation & Lien Mobile</strong>, puis cliquez sur <em>Installer l&apos;Application</em> (ou utilisez <em>Ajouter à l&apos;écran d&apos;accueil</em> dans Chrome / Safari).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-bold text-slate-900">
                  Mes anciens projets disparaissent-ils quand je crée un nouveau mois ?
                </p>
                <p className="text-slate-600 mt-1">
                  Non. Tous vos mois précédents sont conservés dans les archives et fusionnés automatiquement avec le Cloud. Vous pouvez les rouvrir à tout moment via la barre des périodes ou le bouton <strong>Projets</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-bold text-slate-900">
                  Comment exporter mes comptes en PDF ou Excel (CSV) ?
                </p>
                <p className="text-slate-600 mt-1">
                  Ouvrez le menu $(\dots)$ en haut à droite $\rightarrow$ <strong>Exporter le rapport</strong> pour télécharger un rapport PDF imprimable, un fichier CSV compatible Excel ou une sauvegarde JSON complète.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Fichier complet également disponible dans <code className="font-mono text-slate-700">DOCUMENTATION.md</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
