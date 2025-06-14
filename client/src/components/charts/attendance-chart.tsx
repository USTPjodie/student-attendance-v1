import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'Mon', attendance: 85 },
  { day: 'Tue', attendance: 92 },
  { day: 'Wed', attendance: 78 },
  { day: 'Thu', attendance: 96 },
  { day: 'Fri', attendance: 88 },
];

export default function AttendanceChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis domain={[0, 100]} />
        <Tooltip 
          formatter={(value) => [`${value}%`, 'Attendance Rate']}
          labelStyle={{ color: '#1e3a8a' }}
        />
        <Line 
          type="monotone" 
          dataKey="attendance" 
          stroke="#1e3a8a" 
          strokeWidth={3}
          dot={{ fill: '#1e3a8a', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#f59e0b' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
