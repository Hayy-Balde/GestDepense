import React from "react";

export default function AccountsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptes</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos comptes bancaires et portefeuilles.</p>
        </div>
        <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          + Nouveau Compte
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Mock Account Card */}
        <div className="bg-white rounded-lg shadow p-5 border-t-4 border-indigo-500">
          <h3 className="text-lg font-medium text-gray-900">Compte Courant</h3>
          <p className="text-sm text-gray-500 mt-1">Banque Principale</p>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-2xl font-bold text-gray-900">2,450.00 €</span>
          </div>
        </div>
      </div>
    </div>
  );
}
