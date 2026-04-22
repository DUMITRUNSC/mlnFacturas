import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessContext } from '../context/BusinessContext.jsx';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { IMaskInput } from 'react-imask';
import {
  isValidNifNieOrCif,
  isValidPhone,
  isValidIban,
  formatIban
} from '../helpers/validateSpanishId.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/* ─── Validation ─────────────────────────────────────────────────────────── */
const schema = yup.object({
  companyName: yup.string().trim().required('Nombre de la empresa obligatorio'),
  nif: yup.string().trim().required('NIF/NIE/CIF obligatorio')
    .test('valid-nif', 'NIF, NIE o CIF no válido', v => isValidNifNieOrCif(v || '')),
  phone: yup.string().transform(v => (v || '').trim()).required('Teléfono obligatorio')
    .test('valid-phone', 'Formato: +34 637 69 68 13', v => isValidPhone(v || '')),
  street: yup.string().trim().required('Calle obligatoria'),
  locality: yup.string().trim().required('Localidad obligatoria'),
  postalCode: yup.string().required('Código postal obligatorio').matches(/^\d{5}$/, 'Debe ser 5 dígitos'),
  community: yup.string().trim().required('Comunidad obligatoria'),
  holder: yup.string().trim().required('Titular obligatorio'),
  bank: yup.string().trim().required('Banco obligatorio'),
  accountNumber: yup.string().transform(v => (v || '').trim()).required('IBAN obligatorio')
    .test('valid-iban', 'Formato IBAN: ES + 22 dígitos', v => isValidIban(v || '')),
}).required();

/* ─── Field ──────────────────────────────────────────────────────────────── */
function Field({ label, error, children, hint, half }) {
  return (
    <div className={half ? "" : ""}>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────────── */
const inputCls = (err) =>
  `w-full px-4 py-3 text-sm border-2 rounded-xl bg-white placeholder-slate-400
   focus:outline-none focus:border-blue-500 transition-colors
   ${err ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`;

/* ─── Section divider ────────────────────────────────────────────────────── */
function SectionHeader({ icon, label, color = "blue" }) {
  const cfg = {
    blue:    { dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50"    },
    violet:  { dot: "bg-violet-500",  text: "text-violet-700",  bg: "bg-violet-50"  },
    emerald: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  }[color] || { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50" };

  return (
    <div className={`flex items-center gap-2.5 px-5 py-3 ${cfg.bg}`}>
      <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
      <span className={`text-xs font-black uppercase tracking-widest ${cfg.text}`}>{label}</span>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function BusinessData() {
  const navigate = useNavigate();
  const { business, setBusiness } = useContext(BusinessContext);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      ...business,
      community: business.community || 'Madrid',
      phone: business.phone || '',
      accountNumber: formatIban(business.accountNumber || ''),
    },
    resolver: yupResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = data => {
    setBusiness(data);
    toast.success('Datos guardados correctamente', { position: 'top-right' });
    setTimeout(() => navigate('/'), 1500);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-8">
      <ToastContainer />

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-slate-900">Datos de la Empresa</h1>
        <p className="text-slate-500 text-sm mt-1">
          Aparecen en todas tus facturas y presupuestos
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Single card with sections */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">

          {/* ── EMPRESA ── */}
          <SectionHeader label="Empresa" color="blue" />
          <div className="p-5 space-y-4">
            <Controller name="companyName" control={control} render={({ field }) => (
              <Field label="Nombre de la empresa" error={errors.companyName?.message}>
                <input {...field} className={inputCls(errors.companyName)} placeholder="MLN Construcciones SL" />
              </Field>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <Controller name="nif" control={control} render={({ field }) => (
                <Field label="NIF / NIE / CIF" error={errors.nif?.message}>
                  <input {...field} className={inputCls(errors.nif)} placeholder="B12345678" />
                </Field>
              )} />
              <Controller name="phone" control={control} render={({ field }) => (
                <Field label="Teléfono" error={errors.phone?.message}>
                  <IMaskInput
                    {...field}
                    mask="+34 000 00 00 00"
                    unmask={false}
                    lazy={false}
                    placeholder="+34 637 69 68 13"
                    className={inputCls(errors.phone)}
                    onAccept={value => field.onChange(value)}
                  />
                </Field>
              )} />
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* ── DIRECCIÓN ── */}
          <SectionHeader label="Dirección" color="violet" />
          <div className="p-5 space-y-4">
            <Controller name="street" control={control} render={({ field }) => (
              <Field label="Calle y número" error={errors.street?.message}>
                <input {...field} className={inputCls(errors.street)} placeholder="Calle Mayor, 10" />
              </Field>
            )} />
            <div className="grid grid-cols-3 gap-3">
              <Controller name="postalCode" control={control} render={({ field }) => (
                <Field label="Cód. Postal" error={errors.postalCode?.message}>
                  <input {...field} className={inputCls(errors.postalCode)} placeholder="28001" />
                </Field>
              )} />
              <Controller name="locality" control={control} render={({ field }) => (
                <Field label="Localidad" error={errors.locality?.message}>
                  <input {...field} className={inputCls(errors.locality)} placeholder="Madrid" />
                </Field>
              )} />
              <Controller name="community" control={control} render={({ field }) => (
                <Field label="Comunidad" error={errors.community?.message}>
                  <input {...field} className={inputCls(errors.community)} placeholder="Madrid" />
                </Field>
              )} />
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* ── BANCO ── */}
          <SectionHeader label="Banco" color="emerald" />
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="holder" control={control} render={({ field }) => (
                <Field label="Titular de la cuenta" error={errors.holder?.message}>
                  <input {...field} className={inputCls(errors.holder)} placeholder="Juan Pérez García" />
                </Field>
              )} />
              <Controller name="bank" control={control} render={({ field }) => (
                <Field label="Banco" error={errors.bank?.message}>
                  <input {...field} className={inputCls(errors.bank)} placeholder="Banco Sabadell" />
                </Field>
              )} />
            </div>
            <Controller name="accountNumber" control={control} render={({ field }) => (
              <Field label="IBAN" error={errors.accountNumber?.message} hint="Ej: ES36 0081 5735 4600 0196 0306">
                <input
                  {...field}
                  onChange={e => field.onChange(formatIban(e.target.value))}
                  value={formatIban(field.value)}
                  className={inputCls(errors.accountNumber)}
                  placeholder="ES36 0081 5735 4600 0196 0306"
                />
              </Field>
            )} />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-3 text-sm font-semibold bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 text-sm font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
          >
            {isSubmitting ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            Guardar datos de la empresa
          </button>
        </div>
      </form>
    </div>
  );
}
