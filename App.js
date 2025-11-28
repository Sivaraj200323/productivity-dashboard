import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Calendar, TrendingUp, Users, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProductivityDashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('All');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [months, setMonths] = useState([]);
  const [users, setUsers] = useState([]);

  // Convert Google Sheets URL to CSV export URL
  const SHEET_ID = '1br-F3OlvJWn5TDn1Loh7WEXOtVw-o1Y7gl3kAxaMfHM';
  const SHEET_GID = '0'; // First sheet
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

  // Parse CSV data
  const parseCSV = (csv) => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const obj = {};
      const values = lines[i].split(',').map(v => v.trim());
      
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      
      rows.push(obj);
    }

    return rows;
  };

  // Fetch data from Google Sheets
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(CSV_URL);
        const csv = await response.text();
        const parsedData = parseCSV(csv);
        
        setData(parsedData);
        setLastUpdated(new Date().toLocaleString());

        // Extract unique months
        const uniqueMonths = [...new Set(parsedData.map(row => row.Month))].filter(Boolean);
        setMonths(['All', ...uniqueMonths]);

        // Extract unique users
        const uniqueUsers = [...new Set(parsedData.map(row => row['User Name']))].filter(Boolean);
        setUsers(['All', ...uniqueUsers]);

        // Set initial filter
        if (parsedData.length > 0) {
          setSelectedDate(parsedData[parsedData.length - 1].Date);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on selections
  useEffect(() => {
    let filtered = data;

    if (selectedMonth !== 'All') {
      filtered = filtered.filter(row => row.Month === selectedMonth);
    }

    if (selectedDate) {
      filtered = filtered.filter(row => row.Date === selectedDate);
    }

    if (selectedUser !== 'All') {
      filtered = filtered.filter(row => row['User Name'] === selectedUser);
    }

    setFilteredData(filtered);
  }, [selectedMonth, selectedDate, selectedUser, data]);

  // Calculate summary metrics
  const calculateMetrics = () => {
    if (filteredData.length === 0) return {};

    const totalHours = filteredData.reduce((sum, row) => sum + (parseFloat(row['# of Hours']) || 0), 0);
    const totalTarget = filteredData.reduce((sum, row) => sum + (parseFloat(row['Target']) || 0), 0);
    const totalAchieved = filteredData.reduce((sum, row) => sum + (parseFloat(row['Achieved']) || 0), 0);
    const avgProductivity = filteredData.length > 0 
      ? (filteredData.reduce((sum, row) => sum + (parseFloat(row['Productivity (%)']) || 0), 0) / filteredData.length).toFixed(1)
      : 0;
    const totalAudited = filteredData.reduce((sum, row) => sum + (parseFloat(row['Audited']) || 0), 0);
    const avgQuality = filteredData.length > 0
      ? (filteredData.reduce((sum, row) => sum + (parseFloat(row['Quality %']) || 0), 0) / filteredData.length).toFixed(1)
      : 0;

    return {
      hours: totalHours.toFixed(1),
      target: totalTarget.toFixed(0),
      achieved: totalAchieved.toFixed(0),
      productivity: avgProductivity,
      audited: totalAudited.toFixed(0),
      quality: avgQuality,
      count: filteredData.length,
    };
  };

  const metrics = calculateMetrics();

  // Get all dates for selected month
  const getDatesForMonth = () => {
    let filtered = data;
    if (selectedMonth !== 'All') {
      filtered = filtered.filter(row => row.Month === selectedMonth);
    }
    if (selectedUser !== 'All') {
      filtered = filtered.filter(row => row['User Name'] === selectedUser);
    }
    return [...new Set(filtered.map(row => row.Date))].filter(Boolean).sort();
  };

  // Get trend data for charts
  const getTrendData = () => {
    let filtered = data;
    if (selectedMonth !== 'All') {
      filtered = filtered.filter(row => row.Month === selectedMonth);
    }
    if (selectedUser !== 'All') {
      filtered = filtered.filter(row => row['User Name'] === selectedUser);
    }
    return filtered;
  };

  // Get user performance data
  const getUserPerformance = () => {
    let filtered = data;
    if (selectedMonth !== 'All') {
      filtered = filtered.filter(row => row.Month === selectedMonth);
    }
    if (selectedDate) {
      filtered = filtered.filter(row => row.Date === selectedDate);
    }

    const userStats = {};
    filtered.forEach(row => {
      const user = row['User Name'];
      if (!userStats[user]) {
        userStats[user] = {
          name: user,
          productivity: [],
          quality: [],
          hours: 0,
        };
      }
      userStats[user].productivity.push(parseFloat(row['Productivity (%)']) || 0);
      userStats[user].quality.push(parseFloat(row['Quality %']) || 0);
      userStats[user].hours += parseFloat(row['# of Hours']) || 0;
    });

    return Object.values(userStats).map(stat => ({
      name: stat.name,
      avgProductivity: (stat.productivity.reduce((a, b) => a + b, 0) / stat.productivity.length).toFixed(1),
      avgQuality: (stat.quality.reduce((a, b) => a + b, 0) / stat.quality.length).toFixed(1),
      hours: stat.hours.toFixed(1),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Productivity Dashboard</h1>
          <p className="text-slate-400 flex items-center gap-2">
            <RefreshCw size={16} className="inline" />
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Month Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                <Calendar size={16} className="inline mr-2" />
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedDate('');
                }}
                className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                <Calendar size={16} className="inline mr-2" />
                Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Dates</option>
                {getDatesForMonth().map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                <Users size={16} className="inline mr-2" />
                User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {users.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <RefreshCw size={32} className="text-blue-400" />
            </div>
            <p className="text-slate-300 mt-4">Loading dashboard...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                <div className="text-xs opacity-90 mb-2">Hours Logged</div>
                <div className="text-3xl font-bold">{metrics.hours}h</div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white">
                <div className="text-xs opacity-90 mb-2">Target Tasks</div>
                <div className="text-3xl font-bold">{metrics.target}</div>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white">
                <div className="text-xs opacity-90 mb-2">Tasks Achieved</div>
                <div className="text-3xl font-bold">{metrics.achieved}</div>
              </div>

              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-6 text-white">
                <div className="text-xs opacity-90 mb-2">Avg Productivity</div>
                <div className="text-3xl font-bold">{metrics.productivity}%</div>
              </div>

              <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-lg p-6 text-white">
                <div className="text-xs opacity-90 mb-2">Quality Score</div>
                <div className="text-3xl font-bold">{metrics.quality}%</div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg p-6 text-white">
                <div className="text-xs opacity-90 mb-2">Audited Items</div>
                <div className="text-3xl font-bold">{metrics.audited}</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Productivity Trend */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">Productivity Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="Date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }}
                      formatter={(value) => `${value}%`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Productivity (%)" stroke="#667eea" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Quality %" stroke="#f093fb" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Target vs Achieved */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">Target vs Achieved</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="Date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="Target" fill="#667eea" />
                    <Bar dataKey="Achieved" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Performance */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
              <h2 className="text-xl font-bold text-white mb-6">User Performance Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getUserPerformance().map((user, idx) => (
                  <div key={idx} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                    <div className="font-semibold text-white mb-3">{user.name}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Productivity:</span>
                        <span className="font-bold text-green-400">{user.avgProductivity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Quality:</span>
                        <span className="font-bold text-blue-400">{user.avgQuality}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hours:</span>
                        <span className="font-bold text-purple-400">{user.hours}h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-6">Detailed Records</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-300">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-center">Hours</th>
                      <th className="px-4 py-3 text-center">Target</th>
                      <th className="px-4 py-3 text-center">Achieved</th>
                      <th className="px-4 py-3 text-center">Productivity %</th>
                      <th className="px-4 py-3 text-center">Quality %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTrendData().slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-700 hover:bg-slate-700">
                        <td className="px-4 py-3">{row.Date}</td>
                        <td className="px-4 py-3">{row['User Name']}</td>
                        <td className="px-4 py-3 text-xs">{row['Project Name']}</td>
                        <td className="px-4 py-3 text-center">{row['# of Hours']}</td>
                        <td className="px-4 py-3 text-center">{row.Target}</td>
                        <td className="px-4 py-3 text-center font-semibold text-green-400">{row.Achieved}</td>
                        <td className="px-4 py-3 text-center font-semibold text-blue-400">{row['Productivity (%)']}</td>
                        <td className="px-4 py-3 text-center font-semibold text-purple-400">{row['Quality %']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-slate-700 rounded-lg border border-slate-600 text-slate-300 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <strong>Real-time Updates:</strong> Dashboard automatically fetches latest data from Google Sheets. Changes appear instantly when you reload the page!
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}