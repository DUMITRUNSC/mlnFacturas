// Valida un DNI (8 dígitos + letra)
function isValidDNI(dni) {
    const match = dni.match(/^(\d{8})([A-Z])$/i);
    if (!match) return false;
    const numero = Number(match[1]) % 23;
    const letra  = "TRWAGMYFPDXBNJZSQVHLCKE"[numero];
    return letra === match[2].toUpperCase();
  }
  
  // Valida un NIE (X/Y/Z + 7 dígitos + letra)
  function isValidNIE(nie) {
    const match = nie.match(/^([XYZ])(\d{7})([A-Z])$/i);
    if (!match) return false;
    const prefix = { X: "0", Y: "1", Z: "2" }[match[1].toUpperCase()];
    const numero = Number(prefix + match[2]) % 23;
    const letra  = "TRWAGMYFPDXBNJZSQVHLCKE"[numero];
    return letra === match[3].toUpperCase();
  }
  
  // Valida un CIF
  function isValidCIF(cif) {
    const ref = cif.toUpperCase().trim();
    const match = ref.match(/^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/);
    if (!match) return false;
    const [ , letraEnt, nums, control ] = match;
  
    let sumPar = 0;
    for (let i = 1; i < 7; i += 2) sumPar += Number(nums[i]);
  
    let sumImpar = 0;
    for (let i = 0; i < 7; i += 2) {
      const prod = Number(nums[i]) * 2;
      sumImpar += Math.floor(prod / 10) + (prod % 10);
    }
  
    const total   = sumPar + sumImpar;
    const unidad  = (10 - (total % 10)) % 10;
    const letras  = "JABCDEFGHI";
    const ctrlLet = /[PQSKW]/.test(letraEnt)
      ? letras[unidad]
      : unidad.toString();
  
    return ctrlLet === control;
  }
  
  // Integradora NIF/NIE/CIF
  export function isValidNifNieOrCif(value) {
    const v = value.trim().toUpperCase();
    return isValidDNI(v) || isValidNIE(v) || isValidCIF(v);
  }
  
  // Valida teléfono: acepta +34 xxx xx xx xx
 export function isValidPhone(value = '') {
    // 1️⃣ extrae solo dígitos
    let digits = value.replace(/\D/g, '');
  
    // 2️⃣ si empieza por '34' (código país), quítalo
    if (digits.startsWith('34')) {
      digits = digits.slice(2);
    }
  
    // 3️⃣ ahora deben quedar exactamente 9 dígitos
    return /^\d{9}$/.test(digits);
  }
  // Valida IBAN español
  export function isValidIban(value = '') {
    const v = value.replace(/\s+/g, '').toUpperCase();
    return /^ES\d{22}$/.test(v);
  }
  
  // Formatea “al vuelo” un teléfono a “+34 637 69 68 13”
  export function formatPhone(value = '') {
    // 1. Extrae solo dígitos
    let digits = value.replace(/\D/g, '');
  
    // 2. Si empieza por "34" (es decir, pegaste "+34..."), lo quitamos
    if (digits.startsWith('34')) {
      digits = digits.slice(2);
    }
  
    // 3. Limitamos a 9 dígitos (número nacional)
    digits = digits.slice(0, 9);
  
    // 4. Si no hay dígitos, devolvemos cadena vacía
    if (!digits) return '';
  
    // 5. Agrupamos en 3‑2‑2‑2
    const parts = [];
    if (digits.length >= 3) {
      parts.push(digits.slice(0, 3));
      if (digits.length >= 5) {
        parts.push(digits.slice(3, 5));
        if (digits.length >= 7) {
          parts.push(digits.slice(5, 7));
          if (digits.length >= 9) {
            parts.push(digits.slice(7, 9));
          }
        }
      }
    } else {
      parts.push(digits);
    }
  
    // 6. Prepend +34
    return `+34 ${parts.join(' ')}`;
  }
  
  // Formatea un IBAN en bloques de cuatro caracteres
  export function formatIban(value = '') {
    const noSpace = value.replace(/\s+/g, '').toUpperCase();
    const parts = noSpace.match(/.{1,4}/g) || [];
    return parts.join(' ');
  }