// Test different date formats
const testDate = new Date('2025-09-29T00:00:00.000Z');
console.log('Original date:', testDate);
console.log('toISOString():', testDate.toISOString());
console.log('toISOString().split("T")[0]:', testDate.toISOString().split('T')[0]);
console.log('toDateString():', testDate.toDateString());
console.log('toLocaleDateString():', testDate.toLocaleDateString());

// Test what day of week this represents
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
console.log('Day of week:', days[testDate.getDay()]);