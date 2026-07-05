// Adjutor Karma (and NIBSS) expect Nigerian numbers in international format
// (+234...), not the local 0-prefixed format we accept and store.
export const toInternationalPhone = (phone: string): string =>
  phone.startsWith('0') ? `+234${phone.slice(1)}` : phone;
