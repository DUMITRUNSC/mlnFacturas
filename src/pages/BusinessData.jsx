// src/pages/BusinessData.jsx
import React, { useContext, useState } from 'react';
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

// — Schema Yup que llama a los helpers —
const schema = yup.object({
  companyName: yup
    .string().trim()
    .required('Nombre de la empresa obligatorio'),

  nif: yup
    .string().trim()
    .required('NIF/NIE/CIF obligatorio')
    .test('valid-nif', 'Introduce un NIF, NIE o CIF válido', v =>
      isValidNifNieOrCif(v || '')
    ),

  phone: yup
    .string()
    .transform(v => (v||'').trim())
    .required('Teléfono obligatorio')
    .test('valid-phone', 'Ej: +34 637 69 68 13', v =>
      isValidPhone(v || '')
    ),

  street: yup
    .string().trim()
    .required('Calle obligatoria'),

  locality: yup
    .string().trim()
    .required('Localidad obligatoria'),

  postalCode: yup
    .string()
    .required('Código postal obligatorio')
    .matches(/^\d{5}$/, 'Debe ser 5 dígitos'),

  community: yup
    .string().trim()
    .required('Comunidad obligatoria'),

  holder: yup
    .string().trim()
    .required('Titular obligatorio'),

  bank: yup
    .string().trim()
    .required('Banco obligatorio'),

  accountNumber: yup
    .string()
    .transform(v => (v||'').trim())
    .required('IBAN obligatorio')
    .test('valid-iban', 'Formato IBAN: ES + 22 dígitos', v =>
      isValidIban(v || '')
    ),
}).required();

export default function BusinessData() {
  const navigate = useNavigate();
  const { business, setBusiness } = useContext(BusinessContext);
  const [step, setStep] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues
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
    toast.success('✅ Datos guardados con éxito', { position: 'top-right' });
    setTimeout(() => navigate('/'), 1500);
  };

  const handlePostalBlur = () => {
    const { postalCode } = getValues();
    if (/^\d{5}$/.test(postalCode)) {
      // Autocompletar con API postal si la tienes…
    }
  };

  const steps = ['📝 Empresa', '📍 Dirección', '🏦 Banco'];
  const inputBase = `
    w-full px-6 py-4 text-xl placeholder-gray-600 border-2 rounded-lg
    bg-gradient-to-r from-blue-50 to-blue-100
    focus:outline-none focus:ring-4 focus:ring-blue-300
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center p-8">
      <ToastContainer />
      <div className="bg-white shadow-2xl rounded-3xl w-full max-w-4xl p-12">
        <h1 className="text-5xl font-extrabold text-center mb-10">
          📂 Datos de la Empresa
        </h1>

        {/* Progress */}
        <ul className="flex justify-between mb-10">
          {steps.map((label, i) => (
            <li key={i}
                className={`flex-1 text-center py-3 text-xl border-b-4 ${
                  i === step
                    ? 'border-blue-700 text-blue-700 font-bold'
                    : 'border-gray-200 text-gray-400'
                }`}>
              {label}
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* Step 0: Empresa */}
          {step === 0 && (
            <div className="space-y-8">
              {/* Nombre de la Empresa */}
              <Controller
                name="companyName"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-2xl font-semibold mb-2">Nombre de la Empresa</label>
                    <input
                      {...field}
                      className={`${inputBase} ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: MLN Construcciones SL"
                    />
                    {errors.companyName && <p className="mt-1 text-red-600">{errors.companyName.message}</p>}
                  </div>
                )}
              />

              {/* NIF / NIE / CIF */}
              <Controller
                name="nif"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-2xl font-semibold mb-2">NIF / NIE / CIF</label>
                    <input
                      {...field}
                      className={`${inputBase} ${errors.nif ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: B12345678"
                    />
                    {errors.nif && <p className="mt-1 text-red-600">{errors.nif.message}</p>}
                  </div>
                )}
              />

              {/* Teléfono */}
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-2xl font-semibold mb-2">Teléfono</label>
                    <IMaskInput
                      {...field}
                      mask="+34 000 00 00 00"
                      unmask={false}
                      lazy={false}
                      placeholder="+34 637 69 68 13"
                      className={`
                        w-full px-6 py-4 text-xl placeholder-gray-600 border-2 rounded-lg
                        bg-gradient-to-r from-blue-100 to-blue-300
                        focus:outline-none focus:ring-4 focus:ring-blue-500
                        ${errors.phone ? 'border-red-500' : 'border-gray-300'}
                      `}
                      onAccept={value => field.onChange(value)}
                    />
                    {errors.phone && <p className="mt-1 text-red-600">{errors.phone.message}</p>}
                  </div>
                )}
              />
            </div>
          )}

          {/* Step 1: Dirección */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Código Postal */}
              <Controller
                name="postalCode"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-2xl font-semibold mb-2">Código Postal</label>
                    <input
                      {...field}
                      onBlur={handlePostalBlur}
                      className={`${inputBase} ${errors.postalCode ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: 46023"
                    />
                    {errors.postalCode && <p className="mt-1 text-red-600">{errors.postalCode.message}</p>}
                  </div>
                )}
              />

              {/* Calle */}
              <Controller
                name="street"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-2xl font-semibold mb-2">Calle</label>
                    <input
                      {...field}
                      className={`${inputBase} ${errors.street ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: Calle Cabo de la Nao Nº1"
                    />
                    {errors.street && <p className="mt-1 text-red-600">{errors.street.message}</p>}
                  </div>
                )}
              />

              {/* Localidad */}
              <Controller
                name="locality"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-2xl font-semibold mb-2">Localidad</label>
                    <input
                      {...field}
                      className={`${inputBase} ${errors.locality ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: Valencia"
                    />
                    {errors.locality && <p className="mt-1 text-red-600">{errors.locality.message}</p>}
                  </div>
                )}
              />

              {/* Comunidad Autónoma */}
              <Controller
                name="community"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-2xl font-semibold mb-2">Comunidad Autónoma</label>
                    <input
                      {...field}
                      className={`${inputBase} ${errors.community ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.community && <p className="mt-1 text-red-600">{errors.community.message}</p>}
                  </div>
                )}
              />
            </div>
          )}

          {/* Step 2: Banco */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Titular */}
              <Controller
                name="holder"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-2xl font-semibold mb-2">Titular</label>
                    <input
                      {...field}
                      className={`${inputBase} ${errors.holder ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: Juan Pérez García"
                    />
                    {errors.holder && <p className="mt-1 text-red-600">{errors.holder.message}</p>}
                  </div>
                )}
              />

              {/* Banco */}
              <Controller
                name="bank"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-2xl font-semibold mb-2">Banco</label>
                    <input
                      {...field}
                      className={`${inputBase} ${errors.bank ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: Banco Sabadell"
                    />
                    {errors.bank && <p className="mt-1 text-red-600">{errors.bank.message}</p>}
                  </div>
                )}
              />

              {/* IBAN */}
              <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-2xl font-semibold mb-2">IBAN</label>
                    <input
                      {...field}
                      onChange={e => field.onChange(formatIban(e.target.value))}
                      value={formatIban(field.value)}
                      className={`${inputBase} ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="ES36 0081 5735 4600 0196 0306"
                    />
                    {errors.accountNumber && <p className="mt-1 text-red-600">{errors.accountNumber.message}</p>}
                  </div>
                )}
              />
            </div>
          )}

          {/* Navegación */}
          <div className="flex justify-between items-center mt-12">
            <button
              type="button"
              onClick={() => (step > 0 ? setStep(s => s - 1) : navigate('/'))}
              className="px-8 py-4 text-xl font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow"
            >
              {step > 0 ? '⬅ Anterior' : '⬅ Volver'}
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="px-8 py-4 text-xl font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
              >
                Siguiente ➡
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 text-xl font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg shadow flex items-center gap-3"
              >
                {isSubmitting && <span className="loading loading-spinner" />} Guardar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}