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
function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ─── Input classes ──────────────────────────────────────────────────────── */
const inputCls = (err) =>
  `w-full px-3 py-2.5 text-sm border rounded-lg bg-white placeholder-slate-400
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
   ${err ? 'border-red-400 bg-red-50' : 'border-slate-300'}`;

/* ─── Step Indicator ─────────────────────────────────────────────────────── */
function StepBar({ step, steps }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
              i < step
                ? 'bg-blue-600 border-blue-600 text-white'
                : i === step
                ? 'bg-white border-blue-600 text-blue-600'
                : 'bg-white border-slate-300 text-slate-400'
            }`}>
              {i < step ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? 'text-blue-600' : 'text-slate-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function BusinessData() {
  const navigate = useNavigate();
  const { business, setBusiness } = useContext(BusinessContext);
  const [step, setStep] = React.useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
    trigger,
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

  const STEPS = ['Empresa', 'Dirección', 'Banco'];
  const STEP_FIELDS = [
    ['companyName', 'nif', 'phone'],
    ['postalCode', 'street', 'locality', 'community'],
    ['holder', 'bank', 'accountNumber'],
  ];

  const handleNext = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep(s => s + 1);
  };

  const onSubmit = data => {
    setBusiness(data);
    toast.success('Datos guardados correctamente', { position: 'top-right' });
    setTimeout(() => navigate('/'), 1500);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <ToastContainer />

      <StepBar step={step} steps={STEPS} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{STEPS[step]}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Paso {step + 1} de {STEPS.length}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Step 0 — Empresa */}
          {step === 0 && (
            <>
              <Controller name="companyName" control={control} render={({ field }) => (
                <Field label="Nombre de la Empresa" error={errors.companyName?.message}>
                  <input {...field} className={inputCls(errors.companyName)} placeholder="MLN Construcciones en Altura SL" />
                </Field>
              )} />
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
            </>
          )}

          {/* Step 1 — Dirección */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Controller name="postalCode" control={control} render={({ field }) => (
                  <Field label="Código Postal" error={errors.postalCode?.message}>
                    <input {...field} className={inputCls(errors.postalCode)} placeholder="28001" />
                  </Field>
                )} />
                <Controller name="locality" control={control} render={({ field }) => (
                  <Field label="Localidad" error={errors.locality?.message}>
                    <input {...field} className={inputCls(errors.locality)} placeholder="Madrid" />
                  </Field>
                )} />
              </div>
              <Controller name="street" control={control} render={({ field }) => (
                <Field label="Calle y número" error={errors.street?.message}>
                  <input {...field} className={inputCls(errors.street)} placeholder="Calle Mayor, 10" />
                </Field>
              )} />
              <Controller name="community" control={control} render={({ field }) => (
                <Field label="Comunidad Autónoma" error={errors.community?.message}>
                  <input {...field} className={inputCls(errors.community)} placeholder="Comunidad de Madrid" />
                </Field>
              )} />
            </>
          )}

          {/* Step 2 — Banco */}
          {step === 2 && (
            <>
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
              <Controller name="accountNumber" control={control} render={({ field }) => (
                <Field label="IBAN" error={errors.accountNumber?.message} hint="Formato: ES36 0081 5735 4600 0196 0306">
                  <input
                    {...field}
                    onChange={e => field.onChange(formatIban(e.target.value))}
                    value={formatIban(field.value)}
                    className={inputCls(errors.accountNumber)}
                    placeholder="ES36 0081 5735 4600 0196 0306"
                  />
                </Field>
              )} />
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/')}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              {step > 0 ? 'Anterior' : 'Cancelar'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                )}
                Guardar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
