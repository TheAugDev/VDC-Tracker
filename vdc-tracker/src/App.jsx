// Deployment Fix - Version 
import React, { useState, useMemo, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, Truck, Package, Upload, Calendar, AlertCircle, TrendingUp, CheckCircle, Clock, DollarSign, Layers, Search, Briefcase, FileText, ArrowUpRight, ArrowDownRight, Filter, Monitor, Cpu, Disc, Download, Printer, Table as TableIcon, Database, Info, Shield, Server, FileSpreadsheet, Linkedin, AlertTriangle, RotateCcw, Hourglass, ArrowUp, ArrowDown
} from 'lucide-react';

// NOTE: In a real environment, you must run: npm install xlsx recharts lucide-react jspdf html2canvas
// import * as XLSX from 'xlsx'; 
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

// --- CONSTANTS ---
// We simulate "Today" as Feb 20, 2025 to make the breach logic deterministic regardless of when you run this code.
const DEMO_CURRENT_DATE = new Date('2025-02-20');
const SLA_DAYS = 5; // Define your SLA here

// --- MOCK DATA (Updated with fields for new features) ---
const DEFAULT_ORDERS = [
  { id: 'RITM42000', date: '2024-01-11', status: 'Delivered', days: 2, type: 'Standard Bundle' },
  { id: 'RITM42005', date: '2024-01-27', status: 'Delivered', days: 5, type: 'Standard Bundle' },
  { id: 'RITM42100', date: '2024-10-05', status: 'Delivered', days: 2, type: 'Standard Bundle' },
  { id: 'RITM42130', date: '2025-01-20', status: 'Delivered', days: 5, type: 'Standard Bundle' },
  { id: 'RITM42137', date: '2025-02-11', status: 'Shipped', days: null, type: 'Standard Bundle' },
  { id: 'RITM42138', date: '2025-02-12', status: 'Processing', days: null, type: 'Standard Bundle' },
  // New "Breached" Orders (Older than 5 days from DEMO_CURRENT_DATE)
  { id: 'RITM42132', date: '2025-02-01', status: 'Processing', days: null, type: 'Standard Bundle' }, 
  { id: 'RITM42135', date: '2025-02-10', status: 'Shipped', days: null, type: 'Standard Bundle' },
];

const DEFAULT_INVENTORY = {
  serialized: [
    // Added 'receivedDate' for Aging Analysis
    { type: 'Laptop', brand: 'Dell', model: 'Latitude 7440', status: 'Assigned', count: 120, receivedDate: '2024-10-01' },
    { type: 'Laptop', brand: 'Dell', model: 'Latitude 7440', status: 'In Stock', count: 20, receivedDate: '2025-01-15' }, // Fresh stock
    { type: 'Laptop', brand: 'Dell', model: 'Latitude 7440', status: 'In Stock', count: 15, receivedDate: '2024-11-01' }, // Stagnant stock
    { type: 'Laptop', brand: 'Dell', model: 'Latitude 7440', status: 'In Stock', count: 10, receivedDate: '2024-08-01' }, // Old stock
    { type: 'Dock', brand: 'Dell', model: 'WD19S', status: 'Assigned', count: 150, receivedDate: '2024-06-01' },
    { type: 'Monitor', brand: 'Dell', model: 'P2422H', status: 'In Stock', count: 100, receivedDate: '2025-01-01' },
    // New "Returns" data - This demonstrates how you should log them in Excel
    { type: 'Laptop', brand: 'Dell', model: 'Latitude 7420', status: 'Returned - Pending Wipe', count: 8, receivedDate: '2025-02-18' },
    { type: 'Laptop', brand: 'Dell', model: 'Latitude 7420', status: 'Returned - Repair', count: 3, receivedDate: '2025-02-18' },
  ],
  bulk: [
    { name: 'Webcam', received: 500, shipped: 150, stock: 350 },
    { name: 'Headset', received: 500, shipped: 150, stock: 350 },
  ]
};

const DEFAULT_FINANCIALS = [
  { po: 'PO-2024-001', date: '2024-01', label: 'Q1 2024', vendor: 'CDW', cost: 125000 },
  { po: 'PO-2025-NEW', date: '2025-01', label: 'Q1 2025', vendor: 'Insight', cost: 130000 },
];

const DEFAULT_ALLOCATION = [
  { date: '2024-01-10', ritm: 'RITM42000', user: 'Alice Smith', laptop: 'SN-LPT-1000' },
  { date: '2024-01-13', ritm: 'RITM42001', user: 'Bob Jones', laptop: 'SN-LPT-1001' },
];

const DEFAULT_CLIENT_FORMAT = [
  { mfg: 'Dell', model: 'Latitude 7440', sn: 'SN-LPT-1000', po: 'PO-2024-001', status: 'In Use' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

// --- COLUMN DEFINITIONS FOR RAW DATA VIEW ---
const RAW_DATA_COLUMNS = {
  orders: [
    { key: 'id', label: 'RITM ID', className: 'font-mono text-slate-600' },
    { key: 'date', label: 'Request Date', className: 'text-slate-600' },
    { key: 'type', label: 'Type', className: 'text-slate-800' },
    { key: 'status', label: 'Status', render: (val) => <span className={`px-2 py-0.5 rounded text-xs font-bold ${val === 'Delivered' ? 'bg-green-100 text-green-700' : val === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{val}</span> },
    { key: 'days', label: 'Days to Deliver', className: 'text-slate-600' },
  ],
  inventory: [
    { key: 'type', label: 'Type', className: 'text-slate-800 font-medium' },
    { key: 'brand', label: 'Brand', className: 'text-slate-600' },
    { key: 'model', label: 'Model', className: 'text-slate-500 font-mono text-xs' },
    { key: 'status', label: 'Status', render: (val) => <span className={`px-2 py-0.5 rounded text-xs font-bold ${val === 'In Stock' ? 'bg-green-100 text-green-700' : val.includes('Returned') ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{val}</span> },
    { key: 'count', label: 'Count', align: 'right', className: 'font-bold' },
  ],
  financials: [
    { key: 'po', label: 'PO Number', className: 'font-mono text-blue-600' },
    { key: 'date', label: 'Date', className: 'text-slate-600' },
    { key: 'vendor', label: 'Vendor', className: 'text-slate-800' },
    { key: 'cost', label: 'Total Cost', align: 'right', className: 'font-mono text-slate-700', render: (val) => `$${val.toLocaleString()}` },
  ],
  allocation: [
    { key: 'date', label: 'Date', className: 'text-slate-600' },
    { key: 'ritm', label: 'RITM', className: 'font-mono text-blue-600' },
    { key: 'user', label: 'User', className: 'text-slate-800' },
    { key: 'laptop', label: 'Laptop SN', className: 'font-mono text-slate-500' },
  ],
  client_format: [
    { key: 'mfg', label: 'Mfg', className: 'text-slate-800' },
    { key: 'model', label: 'Model', className: 'text-slate-600' },
    { key: 'sn', label: 'Serial', className: 'font-mono text-slate-500' },
    { key: 'po', label: 'PO', className: 'font-mono text-blue-600' },
    { key: 'status', label: 'Status', render: (val) => <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600">{val}</span> },
  ]
};

// --- COMPONENTS ---

const Card = ({ title, value, subtext, icon: Icon, colorClass, trend, alert }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border ${alert ? 'border-red-200 bg-red-50' : 'border-slate-100'} flex items-start justify-between hover:shadow-md transition-shadow group relative overflow-hidden`}>
    {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-bl-full -mr-8 -mt-8 z-0"></div>}
    <div className="relative z-10">
      <p className={`text-xs font-bold uppercase tracking-wider transition-colors ${alert ? 'text-red-600' : 'text-slate-500 group-hover:text-slate-700'}`}>{title}</p>
      <h3 className={`text-2xl font-bold mt-2 ${alert ? 'text-red-800' : 'text-slate-800'}`}>{value}</h3>
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span className={`text-xs font-bold flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(trend)}%
          </span>
        )}
        <p className={`${alert ? 'text-red-500' : 'text-slate-400'} text-xs`}>{subtext}</p>
      </div>
    </div>
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 group-hover:bg-opacity-20 transition-all relative z-10`}>
      <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 border-b border-slate-100 pb-4">
    <div>
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
    </div>
    {action}
  </div>
);

const FilterBar = ({ current, onChange }) => (
  <div className="bg-white p-1.5 rounded-lg border border-slate-200 inline-flex shadow-sm">
    {['Yearly', 'Quarterly', 'Monthly', 'Weekly'].map((filter) => (
      <button
        key={filter}
        onClick={() => onChange(filter)}
        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
          current === filter 
            ? 'bg-slate-900 text-white shadow-sm' 
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        {filter}
      </button>
    ))}
  </div>
);

// --- HELPER FOR BADGES ---
const getStatusBadge = (status, count) => {
  let color = 'bg-slate-100 text-slate-600';
  if (status === 'In Stock') color = 'bg-green-100 text-green-700';
  else if (status.includes('Repair')) color = 'bg-red-100 text-red-700';
  else if (status.includes('Returned')) color = 'bg-purple-100 text-purple-700';
  else if (status === 'Assigned') color = 'bg-blue-50 text-blue-600';

  return (
    <span className={`inline-block px-2 py-1 rounded-md font-bold text-xs ${color}`}>
      {count !== undefined ? count : status}
    </span>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('daily');
  const [timeFilter, setTimeFilter] = useState('Monthly');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [invSearch, setInvSearch] = useState('');
  const [dataView, setDataView] = useState('orders'); 
  const [showDeploymentInfo, setShowDeploymentInfo] = useState(false);
  const dashboardRef = useRef(null);
  
  // State for Data
  const [ordersData, setOrdersData] = useState(DEFAULT_ORDERS);
  const [inventoryData, setInventoryData] = useState(DEFAULT_INVENTORY);
  const [financialData, setFinancialData] = useState(DEFAULT_FINANCIALS);
  const [allocationData, setAllocationData] = useState(DEFAULT_ALLOCATION);
  const [clientData, setClientData] = useState(DEFAULT_CLIENT_FORMAT);
  const [fileName, setFileName] = useState(null);
  
  // State for Sorting and Filtering in Raw Data View
  const [dataSearch, setDataSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // --- FILE UPLOAD & PARSING HANDLER ---
  const handleFileUpload = (e) => {
    // In this environment, we simulate file upload processing as XLSX is unavailable.
    // In a real environment, uncomment the logic below and ensure xlsx is installed.
    alert("File upload simulation: In a real app, this parses the Excel file using the XLSX library logic provided in the comments.");
  };

  const exportPDF = () => {
    // In a real app with jsPDF/html2canvas:
    // const input = dashboardRef.current;
    // html2canvas(input).then((canvas) => { ... })
    alert("In a real app, this downloads a PDF report. (Requires local setup)");
  };

  // --- DATA AGGREGATION LOGIC ---
  const aggregatedOrders = useMemo(() => {
    const data = {};
    ordersData.forEach(order => {
      const date = new Date(order.date); 
      if (isNaN(date.getTime())) return;

      let key = '';
      let sortKey = 0;

      if (timeFilter === 'Yearly') {
        key = date.getFullYear().toString();
        sortKey = date.getFullYear();
      }
      else if (timeFilter === 'Quarterly') {
         const q = Math.floor(date.getMonth()/3) + 1;
         key = `${date.getFullYear()} Q${q}`;
         sortKey = parseInt(`${date.getFullYear()}${q}`);
      }
      else if (timeFilter === 'Monthly') {
         key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}`;
         sortKey = parseInt(`${date.getFullYear()}${String(date.getMonth()+1).padStart(2, '0')}`);
      }
      else if (timeFilter === 'Weekly') {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day; 
        const weekStart = new Date(d.setDate(diff));
        key = `${weekStart.getMonth()+1}/${weekStart.getDate()}`;
        sortKey = weekStart.getTime();
      }

      if (!data[key]) data[key] = { name: key, sortKey: sortKey, orders: 0, delivered: 0 };
      data[key].orders += 1;
      if (order.status === 'Delivered') data[key].delivered += 1;
    });
    
    return Object.values(data).sort((a, b) => a.sortKey - b.sortKey);
  }, [timeFilter, ordersData]);

  // --- HELPER FUNCTIONS FOR NEW FEATURES ---
  
  // 1. Feature 5: Logic for Breach List (SLA Rescue)
  const getBreachList = () => {
    return ordersData.filter(o => {
      if (o.status === 'Delivered') return false;
      const orderDate = new Date(o.date);
      const diffTime = Math.abs(DEMO_CURRENT_DATE - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays > SLA_DAYS; 
    }).map(o => {
        const orderDate = new Date(o.date);
        const diffTime = Math.abs(DEMO_CURRENT_DATE - orderDate);
        return { ...o, age: Math.ceil(diffTime / (1000 * 60 * 60 * 24)) };
    }).sort((a, b) => b.age - a.age); // Sort by oldest breach first
  };
  const breachList = getBreachList();

  // 2. Feature 1: Logic for Burn Rate & Depletion
  const getBurnRateMetrics = () => {
    // Calculate simple burn rate based on orders in last 30 days
    const thirtyDaysAgo = new Date(DEMO_CURRENT_DATE);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = ordersData.filter(o => {
      const d = new Date(o.date);
      return d >= thirtyDaysAgo && d <= DEMO_CURRENT_DATE;
    });

    // Avg orders per day
    const burnRate = recentOrders.length / 30; // units/day
    
    // Total Laptop Stock
    const laptopStock = inventoryData.serialized
      .filter(i => i.type === 'Laptop' && i.status === 'In Stock')
      .reduce((acc, curr) => acc + curr.count, 0);

    const daysToDepletion = burnRate > 0 ? Math.floor(laptopStock / burnRate) : 999;
    
    return { burnRate: burnRate.toFixed(1), daysToDepletion, laptopStock };
  };
  const { burnRate, daysToDepletion, laptopStock } = getBurnRateMetrics();

  // 3. Feature 2: Logic for Aging Analysis
  const getInventoryAging = () => {
    const buckets = { '0-30 Days': 0, '31-60 Days': 0, '61-90 Days': 0, '90+ Days': 0 };
    
    inventoryData.serialized.filter(i => i.status === 'In Stock').forEach(item => {
      if (!item.receivedDate) return;
      const recDate = new Date(item.receivedDate);
      const diffTime = Math.abs(DEMO_CURRENT_DATE - recDate);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (days <= 30) buckets['0-30 Days'] += item.count;
      else if (days <= 60) buckets['31-60 Days'] += item.count;
      else if (days <= 90) buckets['61-90 Days'] += item.count;
      else buckets['90+ Days'] += item.count;
    });

    return Object.keys(buckets).map(key => ({ name: key, count: buckets[key] }));
  };
  const agingData = getInventoryAging();

  // 4. Feature 3: Logic for Returns
  const getReturnsMetrics = () => {
    const pendingWipe = inventoryData.serialized
      .filter(i => i.status === 'Returned - Pending Wipe')
      .reduce((acc, curr) => acc + curr.count, 0);
      
    const repair = inventoryData.serialized
      .filter(i => i.status === 'Returned - Repair')
      .reduce((acc, curr) => acc + curr.count, 0);
      
    return { pendingWipe, repair };
  };
  const { pendingWipe, repair } = getReturnsMetrics();


  // --- STANDARD METRICS ---
  const processingCount = ordersData.filter(o => o.status === 'Processing').length;
  const shippedCount = ordersData.filter(o => o.status === 'Shipped').length;
  const deliveredCount = ordersData.filter(o => o.status === 'Delivered').length;
  const deliveredOrders = ordersData.filter(o => o.status === 'Delivered' && o.days !== null);
  const avgCycleTime = deliveredOrders.length ? (deliveredOrders.reduce((sum, o) => sum + o.days, 0) / deliveredOrders.length).toFixed(1) : 0;
  const slaCompliant = deliveredOrders.filter(o => o.days <= SLA_DAYS).length;
  const slaRate = deliveredOrders.length ? Math.round((slaCompliant / deliveredOrders.length) * 100) : 100;
  
  const laptopAssigned = inventoryData.serialized.find(i => i.type === 'Laptop' && i.status === 'Assigned')?.count || 0;
  const totalAssets = laptopStock + laptopAssigned;
  const utilizationRate = totalAssets ? Math.round((laptopAssigned / totalAssets) * 100) : 0;

  const filteredInventory = inventoryData.serialized.filter(item => 
    (item.type && item.type.toLowerCase().includes(invSearch.toLowerCase())) || 
    (item.brand && item.brand.toLowerCase().includes(invSearch.toLowerCase())) || 
    (item.model && item.model.toLowerCase().includes(invSearch.toLowerCase()))
  );

  // --- RAW DATA SORTING & FILTERING HANDLERS ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'daily':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <SectionHeader title="Daily Operations" subtitle="Real-time operational health and pending actions" />
            
            {/* FEATURE 5: BREACH LIST (RESCUE LIST) */}
            {breachList.length > 0 && (
               <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm mb-6">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle className="w-5 h-5"/></div>
                   <div>
                     <h3 className="font-bold text-red-900 text-lg">SLA Breach / Rescue List</h3>
                     <p className="text-red-700 text-xs">These orders are past due ({'>'} {SLA_DAYS} days) and require immediate attention.</p>
                   </div>
                 </div>
                 <div className="bg-white rounded-lg border border-red-100 overflow-hidden">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-red-50 text-red-800 font-semibold border-b border-red-100">
                       <tr><th className="px-4 py-2">RITM#</th><th className="px-4 py-2">Order Date</th><th className="px-4 py-2">Age (Days)</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Action</th></tr>
                     </thead>
                     <tbody className="divide-y divide-red-50">
                       {breachList.map((order, i) => (
                         <tr key={i} className="hover:bg-red-50/50">
                           <td className="px-4 py-3 font-mono font-bold text-red-700">{order.id}</td>
                           <td className="px-4 py-3 text-slate-600">{order.date}</td>
                           <td className="px-4 py-3 font-bold text-red-600">{order.age} Days</td>
                           <td className="px-4 py-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">{order.status}</span></td>
                           <td className="px-4 py-3"><button className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Escalate</button></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card title="Action Required" value={processingCount} subtext="Pending Orders" icon={Clock} colorClass="bg-orange-500 text-orange-500" />
              <Card title="In Transit" value={shippedCount} subtext="With Carrier" icon={Truck} colorClass="bg-blue-500 text-blue-500" />
              {/* FEATURE 3: RETURNS CARD */}
              <Card title="Reverse Logistics" value={pendingWipe + repair} subtext={`${pendingWipe} Pending Wipe`} icon={RotateCcw} colorClass="bg-purple-500 text-purple-500" />
              <Card title="Available Laptops" value={laptopStock} subtext="In Stock (US-NA)" icon={Briefcase} colorClass="bg-indigo-500 text-indigo-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                   <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500" />Recent Order Log</h3>
                   <div className="flex gap-2"><span className="text-[10px] font-mono bg-white border px-2 py-1 rounded text-slate-500 shadow-sm">Live Feed</span></div>
                </div>
                <div className="overflow-x-auto flex-1 max-h-80">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-500 border-b border-slate-100 sticky top-0">
                      <tr><th className="px-6 py-3 font-semibold text-xs uppercase">RITM#</th><th className="px-6 py-3 font-semibold text-xs uppercase">Date</th><th className="px-6 py-3 font-semibold text-xs uppercase">Type</th><th className="px-6 py-3 font-semibold text-xs uppercase">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">{[...ordersData].reverse().slice(0, 6).map((order, i) => (
                        <tr key={i} className="hover:bg-slate-50"><td className="px-6 py-4 font-mono text-slate-600 font-medium">{order.id}</td><td className="px-6 py-4 text-slate-600">{order.date}</td><td className="px-6 py-4 text-slate-800">{order.type}</td><td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</span></td></tr>
                      ))}</tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><Package className="w-4 h-4 text-slate-500" />Consumables Stock</h3>
                <div className="space-y-6">{inventoryData.bulk.slice(0,4).map((item, idx) => (
                    <div key={idx}><div className="flex justify-between text-xs mb-2"><span className="font-semibold text-slate-700">{item.name}</span><span className="text-slate-400 font-medium">{item.stock} Units</span></div><div className="w-full bg-slate-100 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${item.stock < 100 ? 'bg-red-500' : 'bg-slate-800'}`} style={{ width: `${(item.stock / item.received) * 100}%` }}></div></div></div>
                  ))}</div>
              </div>
            </div>
          </div>
        );
      case 'qbr':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <SectionHeader title="Strategic Review (QBR)" subtitle="Performance metrics and trends for external reporting" 
              action={<div className="flex gap-3"><FilterBar current={timeFilter} onChange={setTimeFilter} /><button onClick={exportPDF} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 shadow-md"><Download className="w-4 h-4" /> Export PDF</button></div>} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10"><p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Total Spend (YTD)</p><h3 className="text-4xl font-bold tracking-tight">${financialData.reduce((acc, curr) => acc + curr.cost, 0).toLocaleString()}</h3></div>
                <DollarSign className="absolute right-4 bottom-4 w-32 h-32 text-white opacity-5 transform rotate-12" />
              </div>
              <Card title="Order Volume" value={ordersData.length} subtext={`Distribution by ${timeFilter}`} icon={Layers} colorClass="bg-blue-500 text-blue-500" trend={12.5} />
              <Card title="Asset Utilization" value={`${utilizationRate}%`} subtext="Assigned vs. Stock" icon={Briefcase} colorClass="bg-indigo-500 text-indigo-500" trend={2.1} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
              <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" />Distribution Trends ({timeFilter})</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aggregatedOrders} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1)' }} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" name="Total Requests" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
                <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" />Capital Expenditure (CapEx)</h3>
                <ResponsiveContainer width="100%" height="100%"><BarChart data={financialData} barSize={40}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} prefix="$" /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none' }} formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']} /><Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80 flex flex-col justify-center items-center text-center">
                <div className="p-4 bg-green-50 rounded-full mb-4"><CheckCircle className="w-10 h-10 text-green-600" /></div>
                <h3 className="text-4xl font-bold text-slate-800 mb-1">{avgCycleTime} Days</h3><p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Avg Fulfillment Time</p>
                <div className="flex gap-4 mt-6 w-full justify-center"><div className="text-center px-4 border-r border-slate-100"><span className="block text-lg font-bold text-slate-700">{slaRate}%</span><span className="text-xs text-slate-400">Within SLA</span></div><div className="text-center px-4"><span className="block text-lg font-bold text-slate-700">{deliveredCount}</span><span className="text-xs text-slate-400">Total Delivered</span></div></div>
              </div>
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <SectionHeader title="Inventory Master" subtitle="Real-time stockroom levels, assignments, and locations" action={<div className="relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Filter by Brand, Model..." value={invSearch} onChange={(e) => setInvSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white" /></div>} />
            
            {/* FEATURE 1: BURN RATE & FORECASTING */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
               <Card title="Current Stock" value={laptopStock} subtext="Laptops (US-NA)" icon={Briefcase} colorClass="bg-blue-500 text-blue-500" />
               <Card title="Burn Rate" value={burnRate} subtext="Avg Units / Day (30d)" icon={TrendingUp} colorClass="bg-orange-500 text-orange-500" />
               <Card 
                 title="Stock Forecast" 
                 value={`${daysToDepletion} Days`} 
                 subtext={daysToDepletion < 30 ? "Restock Required Soon" : "Healthy Levels"} 
                 icon={Hourglass} 
                 colorClass={daysToDepletion < 30 ? "bg-red-500 text-red-500" : "bg-green-500 text-green-500"} 
                 alert={daysToDepletion < 20}
               />
               <Card title="Stagnant Stock" value={agingData.find(d => d.name === '90+ Days')?.count || 0} subtext="Units > 90 Days Old" icon={AlertCircle} colorClass="bg-slate-500 text-slate-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 space-y-6">
                 {/* FEATURE 2: AGING ANALYSIS CHART */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-64">
                   <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" />Inventory Aging Analysis (Days in Stock)</h3>
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={agingData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={80} />
                       <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                       <Bar dataKey="count" fill="#64748b" radius={[0, 4, 4, 0]} barSize={20}>
                         {agingData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index === 3 ? '#ef4444' : index === 2 ? '#f59e0b' : '#3b82f6'} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                   <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-600 border-b border-slate-200"><tr><th className="px-6 py-3 font-bold uppercase text-xs">Asset Type</th><th className="px-6 py-3 font-bold uppercase text-xs">Brand</th><th className="px-6 py-3 font-bold uppercase text-xs">Model</th><th className="px-6 py-3 font-bold uppercase text-xs text-right">In Stock</th><th className="px-6 py-3 font-bold uppercase text-xs text-right">Assigned</th><th className="px-6 py-3 font-bold uppercase text-xs text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-50">{filteredInventory.length === 0 ? (<tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400 italic">No assets found matching filter</td></tr>) : (Array.from(new Set(filteredInventory.map(i => `${i.type}|${i.brand}|${i.model}`))).map((key) => { 
                     const [type, brand, model] = key.split('|'); 
                     const items = filteredInventory.filter(i => i.type === type && i.brand === brand && i.model === model); 
                     
                     // Helper: Sum counts by status prefix
                     const getCount = (statusCheck) => items.filter(i => statusCheck(i.status)).reduce((sum, i) => sum + i.count, 0);

                     const inStock = getCount(s => s === 'In Stock');
                     const assigned = getCount(s => s === 'Assigned');
                     const returns = getCount(s => s.includes('Returned')); // Count all return types

                     return (<tr key={key} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 font-semibold text-slate-700 flex items-center gap-2">{type === 'Laptop' ? <Briefcase className="w-4 h-4 text-blue-500" /> : type === 'Monitor' ? <Monitor className="w-4 h-4 text-purple-500" /> : <Disc className="w-4 h-4 text-orange-500" />}{type}</td>
                       <td className="px-6 py-4 text-slate-600 font-medium">{brand}</td>
                       <td className="px-6 py-4 text-slate-500 font-mono text-xs">{model}</td>
                       <td className="px-6 py-4 text-right">
                         {/* Show both Stock and Returns if applicable */}
                         {inStock > 0 && getStatusBadge('In Stock', inStock)}
                         {returns > 0 && <div className="mt-1">{getStatusBadge('Returned - Pending Wipe', returns)}</div>}
                       </td>
                       <td className="px-6 py-4 text-right text-slate-500 font-mono">{assigned}</td>
                       <td className="px-6 py-4 text-right font-bold text-slate-800">{inStock + assigned + returns}</td>
                     </tr>) }))}</tbody></table>
                 </div>
               </div>
               
               <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"><div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-600">Bulk / Consumables</div><div className="p-4 space-y-4">{inventoryData.bulk.map((item, idx) => (<div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-slate-300 transition-colors cursor-default bg-slate-50/50"><div className="flex items-center gap-3"><div className="bg-white border border-slate-200 p-2 rounded-md shadow-sm"><Package className="w-4 h-4 text-slate-600" /></div><div><p className="font-semibold text-sm text-slate-700">{item.name}</p><p className="text-[10px] text-slate-400 uppercase tracking-wide">Rec: {item.received}</p></div></div><div className="text-right"><p className="text-lg font-bold text-slate-800">{item.stock}</p></div></div>))}</div></div>
               </div>
            </div>
          </div>
        );
      case 'data':
        // Prepare data for the table based on selected view
        let rawTableData = [];
        let columns = [];
        
        if (dataView === 'orders') { rawTableData = ordersData; columns = RAW_DATA_COLUMNS.orders; }
        else if (dataView === 'inventory') { rawTableData = inventoryData.serialized; columns = RAW_DATA_COLUMNS.inventory; }
        else if (dataView === 'financials') { rawTableData = financialData; columns = RAW_DATA_COLUMNS.financials; }
        else if (dataView === 'allocation') { rawTableData = allocationData; columns = RAW_DATA_COLUMNS.allocation; }
        else if (dataView === 'client_format') { rawTableData = clientData; columns = RAW_DATA_COLUMNS.client_format; }

        // Filter Data
        if (dataSearch) {
          rawTableData = rawTableData.filter(item => 
            Object.values(item).some(val => 
              String(val).toLowerCase().includes(dataSearch.toLowerCase())
            )
          );
        }

        // Sort Data
        if (sortConfig.key) {
          rawTableData = [...rawTableData].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            
            // Handle numeric strings slightly better if needed, but mostly standard sort is fine
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          });
        }

        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <SectionHeader title="Raw Data Viewer" subtitle="Direct view of underlying Excel datasets" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
                {['Orders', 'Inventory', 'Financials', 'Allocation', 'Client_Format'].map((view) => ( 
                  <button 
                    key={view} 
                    onClick={() => { setDataView(view.toLowerCase()); setSortConfig({key: null, direction: 'asc'}); setDataSearch(''); }} 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${dataView === view.toLowerCase() ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    {view.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search current view..." 
                  value={dataSearch} 
                  onChange={(e) => setDataSearch(e.target.value)} 
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" 
                />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      {columns.map((col) => (
                        <th 
                          key={col.key} 
                          onClick={() => handleSort(col.key)}
                          className={`px-6 py-3 font-bold uppercase text-xs cursor-pointer hover:bg-slate-100 transition-colors select-none group ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                        >
                          <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                            {col.label}
                            <span className="text-slate-400 group-hover:text-slate-600">
                              {sortConfig.key === col.key ? (
                                sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                              )}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rawTableData.length > 0 ? (
                      rawTableData.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          {columns.map((col) => (
                            <td key={col.key} className={`px-6 py-3 ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.className || ''}`}>
                              {col.render ? col.render(item[col.key]) : (
                                col.format ? col.format(item[col.key]) : (item[col.key] || '-')
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-slate-300" />
                            <p>No records found matching "{dataSearch}"</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex justify-end">
                Showing {rawTableData.length} records
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900" ref={dashboardRef}>
      {showDeploymentInfo && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-8 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button onClick={() => setShowDeploymentInfo(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Shield className="text-blue-600"/> Security & Deployment Guide</h2>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Server className="w-4 h-4"/> Where is my data?</h3>
                <p>Your Excel data is processed <strong>locally in your browser</strong>. It is NOT uploaded to any external server or cloud database. Refreshing the page clears the data. This ensures 100% data privacy for your client.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">How to Deploy to Office 365 / SharePoint</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Option 1 (SharePoint):</strong> Upload the build files (HTML/JS) to a SharePoint Document Library. Rename <code>index.html</code> to <code>dashboard.aspx</code> to view it directly.</li>
                  <li><strong>Option 2 (Azure Static Web App):</strong> If you have Azure, deploy this code as a Static Web App linked to your corporate GitHub. It supports Entra ID (Single Sign-On) automatically.</li>
                  <li><strong>Option 3 (Power BI):</strong> While this is a custom React app, you can replicate these visuals in Power BI if you prefer a native O365 solution without custom code hosting.</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end"><button onClick={() => setShowDeploymentInfo(false)} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800">Understood</button></div>
          </div>
        </div>
      )}

      <aside className={`bg-slate-900 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col fixed h-full z-20 shadow-xl print:hidden`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 h-20">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/50"><LayoutDashboard className="w-5 h-5 text-white" /></div>
          {isSidebarOpen && <h1 className="font-bold text-lg tracking-tight text-slate-100">Vantage DC Tracker</h1>}
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab('daily')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Truck className="w-5 h-5" />{isSidebarOpen && "Daily Ops"}</button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Package className="w-5 h-5" />{isSidebarOpen && "Inventory"}</button>
          <button onClick={() => setActiveTab('qbr')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'qbr' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Briefcase className="w-5 h-5" />{isSidebarOpen && "QBR / Strategy"}</button>
          <button onClick={() => setActiveTab('data')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'data' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><TableIcon className="w-5 h-5" />{isSidebarOpen && "Raw Data"}</button>
        </nav>
        <div className="p-4 border-t border-slate-800">
           <div className={`bg-slate-800 rounded-lg p-4 ${isSidebarOpen ? '' : 'hidden'} border border-slate-700`}>
             <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Connected Source</p>
             <div className="flex items-center gap-2 text-xs text-white truncate font-medium"><FileText className="w-3 h-3 text-green-400" />{fileName || "Using Default Mock"}</div>
             <div className="flex items-center gap-2 mt-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-[10px] text-slate-400">Live Sync</span></div>
           </div>
           <button onClick={() => setShowDeploymentInfo(true)} className="mt-3 w-full flex items-center justify-center gap-2 text-[10px] text-slate-500 hover:text-white transition-colors"><Info className="w-3 h-3"/> Security & Deploy</button>
           <div className="mt-4 pt-4 border-t border-slate-700 text-center">
             <a href="https://www.linkedin.com/in/ianravago/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center justify-center gap-1 transition-colors">
               <Linkedin className="w-3 h-3" /> Created by Ian Ravago
             </a>
           </div>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} p-8 print:ml-0 print:p-4`}>
        <header className="flex justify-between items-center mb-8 h-12 print:hidden">
           <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-slate-600 transition-colors"><div className="space-y-1"><div className="w-5 h-0.5 bg-current rounded-full"></div><div className="w-5 h-0.5 bg-current rounded-full"></div><div className="w-5 h-0.5 bg-current rounded-full"></div></div></button>
             <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">{activeTab === 'daily' ? 'Daily Dashboard' : activeTab === 'qbr' ? 'Strategic Review' : activeTab === 'data' ? 'Data Explorer' : 'Inventory Management'}</h1></div>
           </div>
           <div className="flex gap-3">
             <div className="relative group">
                <input type="file" accept=".xlsx" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all hover:shadow-md group-active:scale-95"><Upload className="w-4 h-4" /> {fileName ? "File Loaded" : "Upload Excel"}</button>
             </div>
           </div>
        </header>
        <div className="min-h-[500px]">{renderContent()}</div>
      </main>
    </div>
  );
}