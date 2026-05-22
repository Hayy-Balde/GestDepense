import React from "react";

export default function IncomesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenus</h1>
          <p className="text-gray-500 text-sm mt-1">Suivez vos entrées d'argent.</p>
        </div>
        <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
          + Nouveau Revenu
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-10 text-center text-gray-500">
          Liste des revenus (composant en construction)
        </div>
      </div>
    </div>
  );
}
