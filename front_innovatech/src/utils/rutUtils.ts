export const formatRut = (rut: string): string => {
  // Eliminar caracteres no válidos
  let value = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (value.length === 0) return '';
  
  // Separar cuerpo y dígito verificador si la longitud es mayor a 1
  if (value.length > 1) {
    const dv = value.slice(-1);
    let cuerpo = value.slice(0, -1);
    
    // Aplicar formato de puntos al cuerpo
    cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${cuerpo}-${dv}`;
  }
  
  return value;
};

export const validateRut = (rut: string): boolean => {
  // Limpiar el RUT antes de validar
  const cleanRutStr = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleanRutStr.length < 2) return false;
  
  const cuerpo = cleanRutStr.slice(0, -1);
  const dv = cleanRutStr.slice(-1);
  
  let suma = 0;
  let multiplo = 2;
  
  // Calcular la suma
  for (let i = 1; i <= cuerpo.length; i++) {
    const index = multiplo * parseInt(cuerpo.charAt(cuerpo.length - i), 10);
    suma += index;
    
    if (multiplo < 7) {
      multiplo += 1;
    } else {
      multiplo = 2;
    }
  }
  
  // Calcular dígito verificador esperado
  const dvEsperado = 11 - (suma % 11);
  let dvEsperadoStr = dvEsperado.toString();
  if (dvEsperado === 11) dvEsperadoStr = '0';
  else if (dvEsperado === 10) dvEsperadoStr = 'K';
  
  return dv === dvEsperadoStr;
};
