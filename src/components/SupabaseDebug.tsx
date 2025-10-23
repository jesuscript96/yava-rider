import React from 'react'
import { getSupabaseConfig } from '../lib/supabaseUtils'

const SupabaseDebug: React.FC = () => {
  const config = getSupabaseConfig()

  if (import.meta.env.PROD) {
    return null // No mostrar en producción
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs max-w-xs">
      <h4 className="font-bold mb-2">🔧 Supabase Config</h4>
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className={config.hasUrl ? 'text-green-400' : 'text-red-400'}>
            {config.hasUrl ? '✅' : '❌'}
          </span>
          <span>URL</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={config.hasAnonKey ? 'text-green-400' : 'text-red-400'}>
            {config.hasAnonKey ? '✅' : '❌'}
          </span>
          <span>Anon Key</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={config.hasServiceKey ? 'text-green-400' : 'text-red-400'}>
            {config.hasServiceKey ? '✅' : '❌'}
          </span>
          <span>Service Key</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={config.serviceClientAvailable ? 'text-green-400' : 'text-yellow-400'}>
            {config.serviceClientAvailable ? '✅' : '⚠️'}
          </span>
          <span>Service Client</span>
        </div>
      </div>
      {!config.serviceClientAvailable && (
        <p className="text-yellow-300 mt-2 text-xs">
          Usando solo cliente anónimo
        </p>
      )}
    </div>
  )
}

export default SupabaseDebug
