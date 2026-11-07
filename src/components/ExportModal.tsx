import React, { useState } from 'react';
import { X, Download, FileText, Upload, Printer, CheckCircle2, FileSpreadsheet, Smartphone } from 'lucide-react';
import { BudgetState } from '../types';
import { exportBudgetJSON, importBudgetJSON } from '../lib/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetData: BudgetState;
  onImportData: (data: BudgetState) => void;
  onOpenMobileModal?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  budgetData,
  onImportData,
  onOpenMobileModal,
}) => {
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrintReport = (type: 'plan' | 'track') => {
    const title = type === 'plan' ? 'Rapport de Planification Budgétaire' : 'Rapport de Suivi & Transactions';

    let contentHtml = `
      <html>
        <head>
          <title>${title} - Karim DKHILI</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
            h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .meta { color: #64748b; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; }
            .cat-header { background: #e2e8f0; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            <p><strong>Auteur:</strong> Karim DKHILI</p>
            <p><strong>Date d'Émission:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>Revenu Net:</strong> ${budgetData.income} ${budgetData.currency} | <strong>Stratégie:</strong> ${budgetData.strategy}</p>
          </div>
    `;

    if (type === 'plan') {
      contentHtml += `
        <h3>Structure des Postes de Budget</h3>
        <table>
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Nom du Poste</th>
              <th>Budget Attribué (${budgetData.currency})</th>
            </tr>
          </thead>
          <tbody>
      `;
      budgetData.items.forEach((item) => {
        contentHtml += `
          <tr>
            <td>${item.category.toUpperCase()}</td>
            <td>${item.name}</td>
            <td>${item.budget} ${budgetData.currency}</td>
          </tr>
        `;
      });
      contentHtml += `</tbody></table>`;
    } else {
      contentHtml += `
        <h3>Historique des Transactions Réelles</h3>
        <table>
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Description</th>
              <th>Catégorie</th>
              <th>Montant (${budgetData.currency})</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
      `;
      budgetData.transactions.forEach((tx) => {
        contentHtml += `
          <tr>
            <td>${tx.date} ${tx.time}</td>
            <td>${tx.desc}</td>
            <td>${tx.category.toUpperCase()}</td>
            <td>-${tx.amount} ${budgetData.currency}</td>
            <td>${tx.notes || ''}</td>
          </tr>
        `;
      });
      contentHtml += `</tbody></table>`;
    }

    contentHtml += `
        </body>
      </html>
    `;

    // Safe printable HTML download/print compatible with mobile & iframe
    const blob = new Blob([contentHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `SmartBudget_${type === 'plan' ? 'Planification' : 'Transactions'}_${new Date().toISOString().split('T')[0]}.html`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCSV = () => {
    let csv = 'Date,Heure,Description,Categorie,Montant,Devise,Notes\n';
    budgetData.transactions.forEach((tx) => {
      csv += `"${tx.date}","${tx.time}","${tx.desc.replace(/"/g, '""')}","${tx.category}",${tx.amount},"${budgetData.currency}","${(tx.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartBudget_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const jsonStr = exportBudgetJSON(budgetData);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartBudget_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSONSubmit = () => {
    const imported = importBudgetJSON(importJsonText);
    if (imported) {
      onImportData(imported);
      setImportStatus('✅ Restauration réussie des données !');
      setTimeout(() => {
        onClose();
        setImportStatus(null);
      }, 1000);
    } else {
      setImportStatus('❌ Format JSON invalide.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white border border-slate-100 text-slate-800 w-full max-w-lg rounded-[32px] shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Centre de Rapports & Sauvegardes</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Reports */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            1. Rapports Imprimables / HTML
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePrintReport('plan')}
              className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200 rounded-2xl text-left flex items-center space-x-2 text-xs font-bold transition-all text-slate-700"
            >
              <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Rapport Planification</span>
            </button>
            <button
              onClick={() => handlePrintReport('track')}
              className="p-3 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-200 rounded-2xl text-left flex items-center space-x-2 text-xs font-bold transition-all text-slate-700"
            >
              <FileText className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Rapport Suivi</span>
            </button>
          </div>
        </div>

        {/* CSV Export */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            2. Exportation des Dépenses (Excel / CSV)
          </h3>
          <button
            onClick={handleDownloadCSV}
            className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center justify-between text-xs font-bold transition-all text-slate-700"
          >
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Télécharger l'historique en CSV</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
              .CSV
            </span>
          </button>
        </div>

        {/* Backup / Restore JSON */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            3. Sauvegarde & Restauration (JSON)
          </h3>

          <div className="flex space-x-2">
            <button
              onClick={handleDownloadJSON}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 text-white shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Télécharger Backup (.json)</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 font-semibold mb-1">
              Restaurer depuis un fichier JSON de Sauvegarde
            </label>
            <div className="space-y-2">
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      if (content) {
                        setImportJsonText(content);
                        const imported = importBudgetJSON(content);
                        if (imported) {
                          onImportData(imported);
                          setImportStatus('✅ Restauration réussie des données !');
                          setTimeout(() => {
                            onClose();
                            setImportStatus(null);
                          }, 1200);
                        } else {
                          setImportStatus('❌ Le fichier sélectionné ne contient pas un format de sauvegarde valide.');
                        }
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              <textarea
                rows={2}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Ou collez ici le code JSON brut..."
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono p-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {importStatus && (
              <p className="text-xs font-bold mt-1.5 text-emerald-600">{importStatus}</p>
            )}
            <button
              onClick={handleImportJSONSubmit}
              disabled={!importJsonText.trim()}
              className="w-full mt-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-200 flex items-center justify-center space-x-1 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Valider la Restauration Brut</span>
            </button>
          </div>
        </div>

        {/* Section 4: Mobile App & Notifications */}
        {onOpenMobileModal && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              4. Application Mobile & Mises à Jour GitHub
            </h3>
            <button
              onClick={() => {
                onClose();
                onOpenMobileModal();
              }}
              className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-left flex items-center justify-between text-xs font-bold transition-all text-emerald-950"
            >
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Vérifier Mises à Jour GitHub & Installer App Mobile</span>
              </div>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 font-bold">
                GitHub / PWA
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
