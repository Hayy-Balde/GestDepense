import React, { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({ expenses: 0, incomes: 0, balance: 0 });

  useEffect(() => {
    // In a real app, fetch from DashboardController
    setStats({ expenses: 1250, incomes: 3200, balance: 1950 });
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500 font-medium">Solde Total</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.balance} €</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500 font-medium">Revenus (Ce mois)</p>
          <p className="text-3xl font-bold text-green-600 mt-2">+{stats.incomes} €</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500 font-medium">Dépenses (Ce mois)</p>
          <p className="text-3xl font-bold text-red-600 mt-2">-{stats.expenses} €</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow h-64 flex items-center justify-center border border-dashed border-gray-300">
        <span className="text-gray-400">Graphique des tendances (à venir)</span>
      </div>
    </div>
  );
}
