import React, { useState } from 'react';
import { Mail, Cloud, HardDrive, CheckCircle2, RefreshCw, X, Shield, ArrowRight, User, LogOut } from 'lucide-react';
import { UserAccount } from '../types';
import { loginWithGoogle, loginWithEmail, registerWithEmail, logoutUser } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccount?: UserAccount;
  onUpdateAccount: (updated: UserAccount) => void;
  onSyncNow: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userAccount = {
    email: 'karim.dkhili@gmail.com',
    name: 'Karim Dkhili',
    isLoggedIn: false,
    syncMode: 'cloud',
    lastSyncedAt: new Date().toISOString(),
  },
  onUpdateAccount,
  onSyncNow,
}) => {
  const [emailInput, setEmailInput] = useState(userAccount.email);
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState(userAccount.name || 'Karim Dkhili');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoadingAuth(true);
    setErrorMsg(null);
    try {
      const fbUser = await loginWithGoogle();
      if (fbUser) {
        onUpdateAccount({
          ...userAccount,
          email: fbUser.email || emailInput,
          name: fbUser.displayName || nameInput || 'Utilisateur Google',
          isLoggedIn: true,
          syncMode: 'cloud',
          lastSyncedAt: new Date().toISOString(),
        });
        setMsg(`Connecté via Google (${fbUser.email})`);
        onSyncNow();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erreur lors de la connexion Google');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      setErrorMsg('Veuillez remplir l\'email et le mot de passe.');
      return;
    }

    setIsLoadingAuth(true);
    setErrorMsg(null);
    try {
      if (isRegisterMode) {
        const user = await registerWithEmail(emailInput.trim(), passwordInput);
        onUpdateAccount({
          ...userAccount,
          email: user.email || emailInput.trim(),
          name: nameInput.trim() || 'Utilisateur',
          isLoggedIn: true,
          syncMode: 'cloud',
          lastSyncedAt: new Date().toISOString(),
        });
        setMsg('Compte créé et connecté avec succès !');
      } else {
        const user = await loginWithEmail(emailInput.trim(), passwordInput);
        onUpdateAccount({
          ...userAccount,
          email: user.email || emailInput.trim(),
          name: nameInput.trim() || 'Utilisateur',
          isLoggedIn: true,
          syncMode: 'cloud',
          lastSyncedAt: new Date().toISOString(),
        });
        setMsg('Connexion réussie !');
      }
      onSyncNow();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Échec de l\'authentification');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      onUpdateAccount({
        ...userAccount,
        isLoggedIn: false,
        syncMode: 'local',
      });
      setMsg('Déconnexion effectuée.');
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSyncMode = (mode: 'cloud' | 'local') => {
    onUpdateAccount({
      ...userAccount,
      syncMode: mode,
      lastSyncedAt: new Date().toISOString(),
    });
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await onSyncNow();
    setTimeout(() => {
      setIsSyncing(false);
      setMsg('Synchronisation Firebase réussie !');
      setTimeout(() => setMsg(null), 3000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-[28px] shadow-xl p-5 sm:p-6 space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/60">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Compte & Synchro Firebase</h2>
              <p className="text-[11px] text-slate-500">Stockage sécurisé multi-appareils</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google Quick Auth Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoadingAuth}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Se connecter avec Google</span>
          </button>
        </div>

        <div className="relative my-2 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-2 text-[10px] text-slate-400 font-semibold uppercase absolute">ou Email</span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
          {isRegisterMode && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Nom Complet</label>
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ex: Karim Dkhili"
                  className="w-full p-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">Adresse Email</label>
            <div className="relative">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="votre.email@exemple.com"
                required
                className="w-full p-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">Mot de passe</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-emerald-700 font-semibold hover:underline"
            >
              {isRegisterMode ? 'Déjà un compte ? Se connecter' : 'Créer un nouveau compte'}
            </button>
            <button
              type="submit"
              disabled={isLoadingAuth}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-all flex items-center space-x-1 disabled:opacity-50"
            >
              <span>{isRegisterMode ? 'S\'inscrire' : 'Connexion'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Sync Mode Selector */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Mode de Stockage
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleToggleSyncMode('cloud')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                userAccount.syncMode === 'cloud'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Cloud className={`w-4 h-4 ${userAccount.syncMode === 'cloud' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs">Firebase Cloud</span>
              </div>
              {userAccount.syncMode === 'cloud' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
            </button>

            <button
              onClick={() => handleToggleSyncMode('local')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                userAccount.syncMode === 'local'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HardDrive className={`w-4 h-4 ${userAccount.syncMode === 'local' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs">Local Hors-ligne</span>
              </div>
              {userAccount.syncMode === 'local' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Sync Status Banner & Logout */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Statut : <span className="text-emerald-700 font-semibold">{userAccount.isLoggedIn ? 'Connecté' : 'Mode Invité'}</span>
            </p>
            <p className="text-[10px] text-slate-500">
              Dernière synchro : {userAccount.lastSyncedAt ? new Date(userAccount.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center space-x-1 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Synchro</span>
            </button>
            {userAccount.isLoggedIn && (
              <button
                onClick={handleLogout}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <p className="text-center text-xs font-medium text-rose-600 animate-fadeIn bg-rose-50 p-2 rounded-lg border border-rose-200">
            {errorMsg}
          </p>
        )}

        {msg && (
          <p className="text-center text-xs font-semibold text-emerald-700 animate-fadeIn">
            {msg}
          </p>
        )}

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors"
        >
          Fermer
        </button>

      </div>
    </div>
  );
};

