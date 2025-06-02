// src/context/BusinessContext.jsx
import React, { createContext, useState, useEffect } from 'react';

// 1️⃣ Creamos el Context
export const BusinessContext = createContext();

// 2️⃣ Provider que envuelve la app y persiste en localStorage
export function BusinessProvider({ children }) {
  // Cargamos valores iniciales de localStorage o por defecto
  const stored = JSON.parse(localStorage.getItem('businessData')) || {};
  const [business, setBusiness] = useState({
    companyName:   stored.companyName   || '',
    nif:           stored.nif           || '',
    phone:         stored.phone         || '',
    street:        stored.street        || '',
    locality:      stored.locality      || '',
    postalCode:    stored.postalCode    || '',
    community:     stored.community     || '',
    holder:        stored.holder        || '',
    bank:          stored.bank          || '',
    accountNumber: stored.accountNumber || '',
  });

  // Cada vez que cambie business, lo guardamos en localStorage
  useEffect(() => {
    localStorage.setItem('businessData', JSON.stringify(business));
  }, [business]);

  return (
    <BusinessContext.Provider value={{ business, setBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}