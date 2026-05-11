/**
 * Recursively removes undefined values from an object or array.
 * Firestore does not support 'undefined' as a value.
 */
export function sanitizeData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(v => sanitizeData(v));
  }
  
  // Check if it's a plain object
  if (data !== null && typeof data === 'object' && (data.constructor === Object || !data.constructor)) {
    return Object.entries(data).reduce((acc: any, [key, value]) => {
      if (value !== undefined) {
        acc[key] = sanitizeData(value);
      }
      return acc;
    }, {});
  }
  
  return data;
}
