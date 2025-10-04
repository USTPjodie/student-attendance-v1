// Test timezone parsing
const dateWithTime = new Date('2025-09-29T00:00:00.000Z');
const dateOnly = new Date('2025-09-29');

console.log('Date with time (UTC):', dateWithTime);
console.log('Date only (local):', dateOnly);

console.log('Date with time (local string):', dateWithTime.toString());
console.log('Date only (local string):', dateOnly.toString());

console.log('Date with time (UTC day):', dateWithTime.getUTCDay());
console.log('Date only (local day):', dateOnly.getDay());

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
console.log('Date with time (UTC day name):', days[dateWithTime.getUTCDay()]);
console.log('Date only (local day name):', days[dateOnly.getDay()]);