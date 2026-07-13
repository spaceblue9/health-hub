import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export const formatThaiDateFull = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const formatted = format(date, 'EEEEที่ d MMMM yyyy', { locale: th });
  const yearCE = date.getFullYear();
  const yearBE = yearCE + 543;
  return formatted.replace(yearCE.toString(), `พ.ศ. ${yearBE}`);
};

export const formatThaiDateShort = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const formatted = format(date, 'd MMM yyyy', { locale: th });
  const yearCE = date.getFullYear();
  const yearBE = yearCE + 543;
  return formatted.replace(yearCE.toString(), yearBE.toString());
};
