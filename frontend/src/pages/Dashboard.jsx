import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { LogOut, Leaf, Trash2, Box, Recycle, Radio } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { logout } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '';

  const fetchData = useCallback(async () => {
    try {
      const url = filter === 'All' 
        ? `${API_URL}/api/waste` 
        : `${API_URL}/api/waste?wasteType=${filter}`;
      
      const recordsRes = await axios.get(url);
      setRecords(recordsRes.data);

      const analyticsRes = await axios.get(`${API_URL}/api/waste/analytics`);
      const formattedAnalytics = { Wet: 0, Dry: 0, Metal: 0 };
      
      analyticsRes.data.forEach(item => {
        formattedAnalytics[item._id] = item.count;
      });
      setAnalytics(formattedAnalytics);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data', err);
      setLoading(false);
    }
  }, [filter, API_URL]);

  useEffect(() => {
    fetchData();

    // Establish Real-Time Socket.io Connection
    const socketTarget = API_URL || window.location.origin;
    const socket = io(socketTarget, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('new_waste_record', () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchData, API_URL]);

  const groupedByLocality = records.reduce((acc, record) => {
    if (!acc[record.locality]) acc[record.locality] = [];
    acc[record.locality].push(record);
    return acc;
  }, {});

  const pieData = {
    labels: ['Wet Waste', 'Dry Waste', 'Metal Waste'],
    datasets: [
      {
        data: [analytics.Wet || 0, analytics.Dry || 0, analytics.Metal || 0],
        backgroundColor: ['#22c55e', '#eab308', '#ef4444'], // Green, Yellow, Red
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
        hoverOffset: 4
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: 'Inter', size: 14 }
        }
      }
    },
    cutout: '40%', // makes it a semi-doughnut
  };

  const getLocalityPieData = (locRecords) => {
    let wet = 0, dry = 0, metal = 0;
    locRecords.forEach(r => {
      if (r.wasteType === 'Wet') wet++;
      if (r.wasteType === 'Dry') dry++;
      if (r.wasteType === 'Metal') metal++;
    });
    return {
      labels: ['Wet', 'Dry', 'Metal'],
      datasets: [{
        data: [wet, dry, metal],
        backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'Wet': return 'text-green-600 bg-green-100 border-green-200';
      case 'Dry': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Metal': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* 🧭 1. NAVBAR */}
      <nav className="bg-gradient-to-r from-green-600 to-emerald-500 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-white" />
              <span className="text-white font-bold text-xl tracking-wide">Smart Waste Management</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-white/50"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 🔹 SECTION A: HEADER + FILTER */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                <Radio className={`h-3 w-3 mr-1 ${isConnected ? 'animate-pulse text-emerald-600' : 'text-amber-600'}`} />
                {isConnected ? 'Live Socket Connected' : 'Connecting Socket...'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Real-time IoT waste tracking via WebSockets</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5 transition-all shadow-sm outline-none"
            >
              <option value="All">All Waste</option>
              <option value="Wet">Wet</option>
              <option value="Dry">Dry</option>
              <option value="Metal">Metal</option>
            </select>
          </div>
        </div>

        {/* 📦 SECTION C: SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
              <Leaf className="h-32 w-32 text-green-500" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Wet Waste</p>
                <h3 className="text-3xl font-bold text-gray-800">{analytics.Wet || 0}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-yellow-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
              <Box className="h-32 w-32 text-yellow-500" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Box className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dry Waste</p>
                <h3 className="text-3xl font-bold text-gray-800">{analytics.Dry || 0}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
              <Recycle className="h-32 w-32 text-red-500" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Recycle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Metal Waste</p>
                <h3 className="text-3xl font-bold text-gray-800">{analytics.Metal || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 📊 SECTION B: ANALYTICS (VISUAL) */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <h2 className="text-lg font-bold text-gray-800 self-start w-full mb-4">Waste Distribution</h2>
            <div className="w-full max-w-[280px] aspect-square relative">
              {(analytics.Wet || analytics.Dry || analytics.Metal) ? (
                <Pie data={pieData} options={pieOptions} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  No data
                </div>
              )}
            </div>
          </div>

          {/* 📋 SECTION D: WASTE RECORDS */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Recent Records</h2>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">
                Showing {records.length} items
              </span>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {loading ? (
                <div className="text-center py-10 text-gray-500 animate-pulse">Loading records...</div>
              ) : records.length === 0 ? (
                <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                  <Trash2 className="h-12 w-12 text-gray-300 mb-2" />
                  <p>No records found for this filter.</p>
                </div>
              ) : (
                records.map((record) => (
                  <div key={record._id} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 text-sm">
                        {record.locality} - {record.houseNumber}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {new Date(record.date).toLocaleString()}
                      </span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getTypeColor(record.wasteType)} uppercase tracking-wide`}>
                      {record.wasteType}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 🗺️ SECTION E: LOCALITY BREAKDOWN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Locality Breakdown</h2>
          {Object.keys(groupedByLocality).length === 0 ? (
            <div className="text-gray-500 text-center py-6">No data available.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(groupedByLocality).map(([locality, locRecords]) => (
                <div key={locality} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                    {locality}
                  </h3>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-1/3 flex flex-col items-center justify-center">
                      <div className="w-32 h-32">
                        <Pie 
                          data={getLocalityPieData(locRecords)} 
                          options={{
                            plugins: { legend: { display: false }, tooltip: { enabled: true } },
                            cutout: '50%'
                          }} 
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-2 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
                        {locRecords.length} Total Records
                      </span>
                    </div>
                    <div className="w-full lg:w-2/3 space-y-3 overflow-y-auto max-h-[160px] custom-scrollbar pr-2">
                      {locRecords.map(record => (
                        <div key={record._id} className="flex justify-between items-center text-sm bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div>
                            <span className="font-semibold text-gray-700">House: {record.houseNumber}</span>
                            <p className="text-xs text-gray-500 mt-0.5">{new Date(record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(record.date).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getTypeColor(record.wasteType)} uppercase tracking-wide`}>
                            {record.wasteType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

    </div>
  );
}
