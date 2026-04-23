import React from "react";

/**
 * Reusable confirm modal.
 * Replaces the three identical inline ConfirmDialog components
 * that were scattered across FacturasGuardadas, PresupuestosGuardados, and Balances.
 */
export default function ConfirmDialog({
  message,
  confirmLabel  = "Eliminar",
  confirmClass  = "bg-red-600 hover:bg-red-700",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
        <p className="text-sm text-gray-700 mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
