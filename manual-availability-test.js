// Manual test to simulate the getAvailableTimeSlots function
const teacherAvailability = {
  day: 'Monday',
  startTime: '07:30:00',
  endTime: '12:30:00'
};

const bookedSlots = [
  { day: 'Monday', startTime: '08:30:00', endTime: '09:00:00' },
  { day: 'Monday', startTime: '10:30:00', endTime: '11:00:00' },
  { day: 'Monday', startTime: '11:00:00', endTime: '11:30:00' }
];

function generateAvailableSlots(availability, bookedSlots) {
  const [startHour, startMinute] = availability.startTime.split(':').map(Number);
  const [endHour, endMinute] = availability.endTime.split(':').map(Number);
  
  const date = new Date('2025-09-29');
  let currentTime = new Date(date);
  currentTime.setHours(startHour, startMinute, 0, 0);
  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);
  
  const availableSlots = [];
  
  while (currentTime < endTime) {
    const slotEndTime = new Date(currentTime.getTime() + 30 * 60000); // 30 minutes
    if (slotEndTime <= endTime) {
      const slot = {
        day: availability.day,
        startTime: currentTime.toTimeString().slice(0, 8),
        endTime: slotEndTime.toTimeString().slice(0, 8)
      };
      
      // Check if this slot overlaps with any booked slots
      const isBooked = bookedSlots.some(booked => {
        const bookedStart = new Date(`2025-09-29T${booked.startTime}`);
        const bookedEnd = new Date(`2025-09-29T${booked.endTime}`);
        return (
          (currentTime >= bookedStart && currentTime < bookedEnd) ||
          (slotEndTime > bookedStart && slotEndTime <= bookedEnd) ||
          (currentTime <= bookedStart && slotEndTime >= bookedEnd)
        );
      });
      
      if (!isBooked) {
        availableSlots.push(slot);
      }
    }
    currentTime = slotEndTime;
  }
  
  return availableSlots;
}

const availableSlots = generateAvailableSlots(teacherAvailability, bookedSlots);
console.log('Available slots for Monday 2025-09-29:');
availableSlots.forEach((slot, index) => {
  console.log(`${index + 1}. ${slot.startTime} - ${slot.endTime}`);
});