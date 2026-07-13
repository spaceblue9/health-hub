import { useState, useEffect } from 'react';

const MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function ThaiDatePicker({ value, onChange, className, required }) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(''); // B.E.

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setDay(d.getDate().toString());
        setMonth((d.getMonth() + 1).toString());
        setYear((d.getFullYear() + 543).toString());
      }
    } else {
      setDay(''); setMonth(''); setYear('');
    }
  }, [value]);

  const handleChange = (newDay, newMonth, newYear) => {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);
    
    if (newDay && newMonth && newYear) {
      const ceYear = parseInt(newYear) - 543;
      const mm = newMonth.padStart(2, '0');
      const dd = newDay.padStart(2, '0');
      onChange(`${ceYear}-${mm}-${dd}`);
    } else {
      onChange('');
    }
  };

  const currentYearBE = new Date().getFullYear() + 543;
  // Let's generate years from current year + 10 down to current year - 120 (for dob)
  const years = Array.from({ length: 131 }, (_, i) => currentYearBE + 10 - i);

  return (
    <div className={`grid grid-cols-12 gap-1 sm:gap-2 min-w-[220px] sm:min-w-[260px] ${className || ''}`}>
      <select 
        value={day} 
        required={required}
        onChange={e => handleChange(e.target.value, month, year)} 
        className="col-span-3 rounded-xl border-border-medium bg-background px-1 sm:px-3 py-2 shadow-sm text-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia"
      >
        <option value="">วัน</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      
      <select 
        value={month} 
        required={required}
        onChange={e => handleChange(day, e.target.value, year)} 
        className="col-span-5 rounded-xl border-border-medium bg-background px-1 sm:px-3 py-2 shadow-sm text-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia"
      >
        <option value="">เดือน</option>
        {MONTHS.map((m, i) => (
          <option key={i+1} value={i+1}>{m}</option>
        ))}
      </select>
      
      <select 
        value={year} 
        required={required}
        onChange={e => handleChange(day, month, e.target.value)} 
        className="col-span-4 rounded-xl border-border-medium bg-background px-1 sm:px-3 py-2 shadow-sm text-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia"
      >
        <option value="">พ.ศ.</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
