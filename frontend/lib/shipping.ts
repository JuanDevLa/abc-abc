export type ShippingType = 'fast' | 'standard' | 'custom' | 'dropship';

export const getDeliveryDates = (type: ShippingType): string => {
  const today = new Date();
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const addDays = (d: Date, days: number) => { 
    const copy = new Date(d); 
    copy.setDate(copy.getDate() + days); 
    return copy; 
  };
  const formatRange = (start: Date, end: Date) => `${start.getDate()} al ${end.getDate()} de ${months[end.getMonth()]}`;
  
  if (type === 'fast') return formatRange(addDays(today, 3), addDays(today, 7));
  if (type === 'dropship') return formatRange(addDays(today, 22), addDays(today, 25));
  if (type === 'standard' || type === 'custom') return formatRange(addDays(today, 20), addDays(today, 27));
  return "";
};

