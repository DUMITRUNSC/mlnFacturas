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
  companyName:   yup.string().trim().required('Nombre de la empresa obligatorio'),
  nif:           yup.string().trim().required('NIF/NIE/CIF obligatorio')
                   .test('valid-nif', 'NIF, NIE o CIF no válido', v => isValidNifNieOrCif(v || '')),
  phone:         yup.string().transform(v => (v || '').trim()).required('Teléfono obligatorio')
                   .test('valid-phone', 'Formato: +34 637 69 68 13', v => isValidPhone(v || '')),
  street:        yup.string().trim().required('Calle obligatoria'),
  locality:      yup.string().trim().required('Localidad obligatoria'),
  postalCode:    yup.string().required('Código postal obligatorio').matches(/^\d{5}$/, 'Debe ser 5 dígitos'),
  community:     yup.string().trim().required('Comunidad obligatoria'),
  holder:        yup.string().trim().required('Titular obligatorio'),
  bank:          yup.string().trim().required('Banco obligatorio'),
  accountNumber: yup.string().transform(v => (v || '').trim()).required('IBAN obligatorio')
                   .test('valid-iban', 'Formato IBAN: ES + 22 dígitos', v => isValidIban(v || '')),
}).required();

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const inp = (err) =>
  `w-full px-4 py-4 text-base font-medium bg-gray-50 border-2 rounded-2xl
   placeholder-gray-300 focus:outline-none focus:bg-white transition-all
   ${err
     ? 'border-red-300 focus:border-red-400 bg-red-50/40'
     : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`;

function Field({ label, error, hint, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="text-sm text-gray-400 leading-relaxed">{hint}</p>}
      {error && (
        <p className="text-sm font-semibold text-red-500 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Section Card ───────────────────────────────────────────────────────── */
function SectionCard({ icon, iconBg, iconColor, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={1.75} strokeLinecap="round">
            {icon}
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 space-y-5">
        {children}
      </div>
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
      community:     business.community     || 'Madrid',
      phone:         business.phone         || '',
      accountNumber: formatIban(business.accountNumber || ''),
    },
    resolver: yupResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = data => {
    setBusiness(data);
    toast.success('Datos guardados correctamente');
    setTimeout(() => navigate('/'), 1500);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <ToastContainer position="bottom-center" toastClassName="!rounded-2xl !text-base !font-semibold !shadow-xl" />

      {/* ══ CABECERA ══ */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Datos de la empresa</h1>
        <p className="text-base text-gray-500 mt-1">
          Esta información aparece en todas tus facturas y presupuestos
        </p>
      </div>

      {/* ══ CONTENIDO ══ */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 max-w-2xl mx-auto">

          {/* ── SECCIÓN: EMPRESA ── */}
          <SectionCard
            iconBg="bg-blue-100"
            iconColor="#2563eb"
            icon={<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
            title="Datos de la empresa"
            subtitle="Nombre, NIF y teléfono de contacto"
          >
            <Controller name="companyName" control={control} render={({ field }) => (
              <Field label="Nombre de la empresa" error={errors.companyName?.message}>
                <input {...field} className={inp(errors.companyName)} placeholder="MLN Construcciones SL" />
              </Field>
            )} />

            <Controller name="nif" control={control} render={({ field }) => (
              <Field label="NIF / NIE / CIF" error={errors.nif?.message}
                hint="El número fiscal de tu empresa. Ej: B12345678">
                <input {...field} className={inp(errors.nif)} placeholder="B12345678" />
              </Field>
            )} />

            <Controller name="phone" control={control} render={({ field }) => (
              <Field label="Teléfono de contacto" error={errors.phone?.message}>
                <IMaskInput
                  {...field}
                  mask="+34 000 00 00 00"
                  unmask={false}
                  lazy={false}
                  placeholder="+34 637 69 68 13"
                  className={inp(errors.phone)}
                  onAccept={value => field.onChange(value)}
                />
              </Field>
            )} />
          </SectionCard>

          {/* ── SECCIÓN: DIRECCIÓN ── */}
          <SectionCard
            iconBg="bg-violet-100"
            iconColor="#7c3aed"
            icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>}
            title="Dirección fiscal"
            subtitle="Dirección que aparecerá en tus documentos"
          >
            <Controller name="street" control={control} render={({ field }) => (
              <Field label="Calle y número" error={errors.street?.message}>
                <input {...field} className={inp(errors.street)} placeholder="Calle Mayor, 10" />
              </Field>
            )} />

            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2">
                <Controller name="postalCode" control={control} render={({ field }) => (
                  <Field label="Código postal" error={errors.postalCode?.message}>
                    <input {...field} className={inp(errors.postalCode)} placeholder="28001" maxLength={5} />
                  </Field>
                )} />
              </div>
              <div className="col-span-3">
                <Controller name="locality" control={control} render={({ field }) => (
                  <Field label="Localidad" error={errors.locality?.message}>
                    <input {...field} className={inp(errors.locality)} placeholder="Madrid" />
                  </Field>
                )} />
              </div>
            </div>

            <Controller name="community" control={control} render={({ field }) => (
              <Field label="Comunidad autónoma" error={errors.community?.message}>
                <input {...field} className={inp(errors.community)} placeholder="Comunidad de Madrid" />
              </Field>
            )} />
          </SectionCard>

          {/* ── SECCIÓN: BANCO ── */}
          <SectionCard
            iconBg="bg-emerald-100"
            iconColor="#059669"
            icon={<><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>}
            title="Datos bancarios"
            subtitle="Cuenta donde recibirás los pagos"
          >
            <Controller name="holder" control={control} render={({ field }) => (
              <Field label="Titular de la cuenta" error={errors.holder?.message}
                hint="Nombre completo del titular tal como aparece en el banco">
                <input {...field} className={inp(errors.holder)} placeholder="Juan Pérez García" />
              </Field>
            )} />

            <Controller name="bank" control={control} render={({ field }) => (
              <Field label="Nombre del banco" error={errors.bank?.message}>
                <input {...field} className={inp(errors.bank)} placeholder="Banco Sabadell" />
              </Field>
            )} />

            <Controller name="accountNumber" control={control} render={({ field }) => (
              <Field label="Número de cuenta (IBAN)" error={errors.accountNumber?.message}
                hint="Lo encontrarás en tu tarjeta o en la app del banco. Ej: ES36 0081 5735 4600 0196 0306">
                <input
                  {...field}
                  onChange={e => field.onChange(formatIban(e.target.value))}
                  value={formatIban(field.value)}
                  className={inp(errors.accountNumber)}
                  placeholder="ES36 0081 5735 4600 0196 0306"
                />
              </Field>
            )} />
          </SectionCard>

          {/* ── BOTONES ── */}
          <div className="space-y-3 pt-2">
            <button type="submit" disabled={isSubmitting}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-lg font-bold rounded-2xl transition-colors disabled:opacity-60 flex items-center justify-center gap-3 shadow-sm"
              style={{ boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
              {isSubmitting ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              Guardar los datos de la empresa
            </button>

            <button type="button" onClick={() => navigate('/')}
              className="w-full h-12 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-base font-semibold rounded-2xl transition-colors">
              Cancelar y volver al inicio
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
