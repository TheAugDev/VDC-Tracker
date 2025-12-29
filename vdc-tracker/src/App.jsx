import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Truck, Package, Upload, Calendar, AlertCircle, TrendingUp, CheckCircle, Clock, DollarSign, Layers, Search, Briefcase, FileText, ArrowUpRight, ArrowDownRight, Filter, Monitor, Cpu, Disc, Download, Printer, Table as TableIcon, Database, Info, Shield, Server, FileSpreadsheet, Linkedin, AlertTriangle, RotateCcw, Hourglass, ArrowUp, ArrowDown, ThumbsUp, ThumbsDown, MapPin, X, Settings, Image as ImageIcon
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

console.log('🚀 VDC TRACKER - NEW VERSION LOADED - December 29, 2025');

// --- CONSTANTS ---
// Production: Use real current date
const CURRENT_DATE = new Date(); 

// --- DEFAULTS ---
const DEFAULT_ORDERS = [];
const DEFAULT_INVENTORY = { serialized: [], bulk: [], receiveLog: [] };
const DEFAULT_FINANCIALS = [];
const DEFAULT_ALLOCATION = [];
const DEFAULT_CLIENT_FORMAT = [];

// --- COLUMN DEFINITIONS ---
const RAW_DATA_COLUMNS = {
  orders: [
    { key: 'id', label: 'Order ID (RITM)', className: 'font-mono text-slate-600 font-bold' },
    { key: 'date', label: 'Order Date', className: 'text-slate-600' },
    { key: 'type', label: 'Package Type', className: 'text-slate-800' },
    { key: 'status', label: 'Status', render: (val) => <span className={`px-2 py-0.5 rounded text-xs font-bold ${val === 'Delivered' ? 'bg-green-100 text-green-700' : val === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{val}</span> },
    { key: 'deployed', label: 'Deployed', render: (val) => <span className={`px-2 py-0.5 rounded text-xs font-bold ${val ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{val ? 'Yes' : 'No'}</span> },
    { key: 'issue', label: 'Issue', render: (val) => val ? <span className="px-2 py-0.5 rounded text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200">{val}</span> : <span className="text-slate-300">-</span> },
    { key: 'deliveryMethod', label: 'Method', render: (val) => val === 'Pickup' ? <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700">3rd Party Pickup</span> : <span className="text-slate-500 text-xs">Direct</span> },
    { key: 'allocatedUser', label: 'Assigned To', className: 'text-slate-600' },
  ],
  inventory: [
    { key: 'sn', label: 'Serial Number', className: 'font-mono text-blue-600 font-bold text-xs' },
    { key: 'type', label: 'Asset Type', className: 'text-slate-800 font-medium' },
    { key: 'brand', label: 'Manufacturer', className: 'text-slate-600' },
    { key: 'model', label: 'Model', className: 'text-slate-500 font-mono text-xs' },
    { key: 'receivedDate', label: 'Date Received', className: 'text-slate-600' },
    { key: 'status', label: 'Current Status', render: (val) => <span className={`px-2 py-0.5 rounded text-xs font-bold ${val === 'In Stock' ? 'bg-green-100 text-green-700' : (val || '').includes('Returned') ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{val}</span> },
    { key: 'allocatedToUser', label: 'Assigned To', className: 'text-slate-600' },
    { key: 'vendor', label: 'Vendor', className: 'text-slate-600' },
  ],
  financials: [
    { key: 'po', label: 'PO Number', className: 'font-mono text-blue-600' },
    { key: 'type', label: 'Description', className: 'text-slate-800 font-medium' },
    { key: 'qty', label: 'Qty (Calc)', className: 'text-slate-600 font-mono' },
    { key: 'date', label: 'Order Date', className: 'text-slate-600' },
    { key: 'vendor', label: 'Vendor', className: 'text-slate-800' },
    { key: 'cost', label: 'Unit Cost', align: 'right', className: 'font-mono text-slate-500', render: (val) => `$${(val || 0).toLocaleString()}` },
    { key: 'totalCost', label: 'Total Cost', align: 'right', className: 'font-mono text-slate-900 font-bold', render: (val) => `$${(val || 0).toLocaleString()}` },
  ],
  allocation: [
    { key: 'date', label: 'Start Date', className: 'text-slate-600' },
    { key: 'ritm', label: 'RITM#', className: 'font-mono text-blue-600' },
    { key: 'user', label: 'User Name', className: 'text-slate-800' },
    { key: 'laptop', label: 'Laptop SN', className: 'font-mono text-slate-500' },
    { key: 'items', label: 'Items', className: 'text-slate-600' },
  ],
  client_format: [
    { key: 'Manufacturer', label: 'Manufacturer', className: 'text-slate-800' },
    { key: 'Model Number', label: 'Model', className: 'text-slate-600' },
    { key: 'Serial Number', label: 'Serial', className: 'font-mono text-slate-500' },
    { key: 'VDC PO Number', label: 'PO', className: 'font-mono text-blue-600' },
    { key: 'Owned By', label: 'User Name', className: 'text-slate-800 font-medium' },
    { key: 'State (status)', label: 'Status', render: (val) => <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600">{val}</span> },
  ]
};

// --- COMPONENTS ---

const Card = ({ title, value, subtext, icon: Icon, colorClass, trend, alert, tooltip }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border ${alert ? 'border-red-200 bg-red-50' : 'border-slate-100'} flex items-start justify-between hover:shadow-md transition-all group relative hover:z-20`}>
    {/* Decoration Layer - Clipped for alert corner */}
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-bl-full -mr-8 -mt-8 z-0"></div>}
    </div>

    <div className="relative z-10">
      <div className="flex items-center gap-1.5 mb-2">
        <p className={`text-xs font-bold uppercase tracking-wider transition-colors ${alert ? 'text-red-600' : 'text-slate-500 group-hover:text-slate-700'}`}>{title}</p>
        {tooltip && (
          <div className="relative group/info">
            <Info className={`w-3.5 h-3.5 ${alert ? 'text-red-400' : 'text-slate-400'} cursor-help hover:text-blue-500 transition-colors`} />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-xl opacity-0 group-hover/info:opacity-100 transition-opacity z-50 pointer-events-none leading-tight border border-slate-700 text-center">
              {tooltip}
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        )}
      </div>
      <h3 className={`text-2xl font-bold ${alert ? 'text-red-800' : 'text-slate-800'}`}>{value}</h3>
      <div className="flex items-center gap-2 mt-1">
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-bold flex items-center ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
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

const PeriodSelector = ({ current, onChange }) => (
  <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex shadow-sm">
    {['YTD', 'Last 90 Days', 'Last 30 Days', 'All Time'].map((period) => (
      <button
        key={period}
        onClick={() => onChange(period)}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
          current === period 
            ? 'bg-slate-900 text-white shadow-sm' 
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        {period}
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
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [invSearch, setInvSearch] = useState('');
  const [dataView, setDataView] = useState('orders'); 
  const [showDeploymentInfo, setShowDeploymentInfo] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [qbrPeriod, setQbrPeriod] = useState('YTD'); // Main QBR Period State
  const [reportPeriod, setReportPeriod] = useState('YTD'); // PDF Report Period State
  
  // Settings State
  const [slaDays, setSlaDays] = useState(5);
  const [customLogo, setCustomLogo] = useState(null);

  const dashboardRef = useRef(null);
  const reportRef = useRef(null);
  const [libsLoaded, setLibsLoaded] = useState(false);
  
  // State for Data
  const [ordersData, setOrdersData] = useState(DEFAULT_ORDERS);
  const [inventoryData, setInventoryData] = useState(DEFAULT_INVENTORY);
  const [financialData, setFinancialData] = useState(DEFAULT_FINANCIALS);
  const [allocationData, setAllocationData] = useState(DEFAULT_ALLOCATION);
  const [clientData, setClientData] = useState(DEFAULT_CLIENT_FORMAT);
  const [fileName, setFileName] = useState(null);
  const [previewPayload, setPreviewPayload] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const hasAnyData = ordersData.length > 0 || inventoryData.serialized.length > 0 || financialData.length > 0 || allocationData.length > 0 || clientData.length > 0;
  
  // State for Sorting and Filtering in Raw Data View
  const [dataSearch, setDataSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Load external libraries from CDN
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
    ]).then(() => {
      setLibsLoaded(true);
      console.log('External libraries loaded successfully');
    }).catch(err => {
      console.error('Failed to load external libraries', err);
      alert('Failed to load required libraries (Excel/PDF support). Please check your internet connection.');
    });
  }, []);

  // Load persisted data from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vdc-data');
      if (raw) {
        const parsed = JSON.parse(raw);
        setOrdersData(parsed.orders || []);
        setInventoryData(parsed.inventory || { serialized: [], bulk: [], receiveLog: [] });
        setFinancialData(parsed.financials || []);
        setAllocationData(parsed.allocation || []);
        setClientData(parsed.client || []);
      }
      
      const settings = localStorage.getItem('vdc-settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        if (parsedSettings.slaDays) setSlaDays(parsedSettings.slaDays);
        if (parsedSettings.customLogo) setCustomLogo(parsedSettings.customLogo);
      }
    } catch (e) {}
  }, []);

  // Persist to localStorage when data changes
  useEffect(() => {
    try {
      const payload = { orders: ordersData, inventory: inventoryData, financials: financialData, allocation: allocationData, client: clientData };
      localStorage.setItem('vdc-data', JSON.stringify(payload));
    } catch (e) {}
  }, [ordersData, inventoryData, financialData, allocationData, clientData]);

  // Persist settings
  useEffect(() => {
    try {
      const settings = { slaDays, customLogo };
      localStorage.setItem('vdc-settings', JSON.stringify(settings));
    } catch (e) {}
  }, [slaDays, customLogo]);

  // --- SETTINGS HANDLERS ---
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setCustomLogo(null);
  };

  // --- FILE UPLOAD & PARSING HANDLER ---
  const handleFileUpload = (e) => {
    if (!libsLoaded) {
      alert("Libraries are still loading... please wait a moment.");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const XLSX = window.XLSX; // Access generic window object
        const workbook = XLSX.read(event.target.result, { type: 'array' });

        const parsed = {
          orders: [],
          inventory: { serialized: [], bulk: [], receiveLog: [] },
          financials: [],
          allocation: [],
          client: []
        };

        // Helper to find sheet names robustly
        const findSheet = (wb, potentialNames) => {
          if (!wb || !wb.SheetNames) return null;
          for (const name of potentialNames) {
            // 1. Try exact match
            const exact = wb.SheetNames.find(s => s.trim().toLowerCase() === name.toLowerCase());
            if (exact) return exact;
            // 2. Try loose match
            const loose = wb.SheetNames.find(s => s.toLowerCase().includes(name.toLowerCase()));
            if (loose) return loose;
          }
          return null;
        };

        // Helper to safely get value from row with fuzzy key matching
        const getValue = (row, keys) => {
          if (!row) return undefined;
          const rowKeys = Object.keys(row);
          
          // 1. Try exact match first
          for (const k of keys) {
            if (row[k] !== undefined) return row[k];
          }
          
          // 2. Try case-insensitive trimmed match (handles "Cost " vs "Cost")
          for (const k of keys) {
            const foundKey = rowKeys.find(rk => rk.trim().toLowerCase() === k.toLowerCase());
            if (foundKey) return row[foundKey];
          }
          
          // 3. Try partial match (e.g. "Total Cost" for "Cost")
          for (const k of keys) {
             const foundKey = rowKeys.find(rk => rk.toLowerCase().includes(k.toLowerCase()));
             if (foundKey) return row[foundKey];
          }
          return undefined;
        };

        // Helper to parse Excel serial dates (like 46017) to YYYY-MM-DD
        const parseExcelDate = (val) => {
          if (!val) return '';
          if (typeof val === 'string') return val;
          const excelEpoch = new Date('1899-12-30');
          const date = new Date(excelEpoch.getTime() + val * 24 * 60 * 60 * 1000);
          // Check for valid date
          if (isNaN(date.getTime())) return '';
          return date.toISOString().split('T')[0];
        };

        // Helper to parse currency strings
        const parseCurrency = (val) => {
          if (val === undefined || val === null || val === '') return 0;
          if (typeof val === 'number') return val;
          // Handle strings like "$ 1,250.00" or "1,250"
          const cleanStr = String(val).replace(/[^0-9.-]+/g,"");
          const parsed = parseFloat(cleanStr);
          return isNaN(parsed) ? 0 : parsed;
        };

        // Helper to parse integers safely
        const parseInteger = (val) => {
           if (val === undefined || val === null || val === '') return 0;
           if (typeof val === 'number') return Math.floor(val);
           const cleanStr = String(val).replace(/[^0-9]/g,"");
           const parsed = parseInt(cleanStr);
           return isNaN(parsed) ? 0 : parsed;
        }

        // Helper to categorize Delivery Issues
        const categorizeIssue = (comments) => {
          if (!comments) return null;
          const c = comments.toLowerCase();
          
          // Specific check for address changes/reroutes
          if (c.includes('reroute') || (c.includes('change') && c.includes('address')) || c.includes('update address')) return 'Address Change In Transit';
          
          if (c.includes('address') || c.includes('location')) return 'Wrong Address';
          if (c.includes('unavailable') || c.includes('not home') || c.includes('missed')) return 'User Unavailable';
          if (c.includes('damaged') || c.includes('broken')) return 'Damaged';
          if (c.includes('lost')) return 'Lost in Transit';
          if (c.includes('refused') || c.includes('rejected')) return 'Refused';
          if (c.includes('delay') || c.includes('weather')) return 'Carrier Delay';
          if (c.includes('missing') || c.includes('incomplete')) return 'Missing Item';
          return 'Other Issue'; // Default catch-all for non-standard comments
        };

        // Helper to identify delivery method from comments or address
        const identifyDeliveryMethod = (comments, address) => {
          const text = (comments || '') + ' ' + (address || '');
          const t = text.toLowerCase();
          if (t.includes('walgreens') || t.includes('fedex onsite') || t.includes('pickup') || t.includes('hold for') || t.includes('dollar general') || t.includes('cvs')) {
            return 'Pickup';
          }
          return 'Direct';
        };

        // Raw sheet data for merging
        let rawOrders = [], rawInventory = [], rawFinancials = [], rawAllocations = [];

        // 1. Parse Orders_Tracking
        const ordersSheet = findSheet(workbook, ['Orders_Tracking', 'Orders Tracking', 'Orders']);
        if (ordersSheet) {
          const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[ordersSheet]);
          rawOrders = sheet;
          parsed.orders = sheet
            .map(row => {
              const id = getValue(row, ['Order ID (RITM)', 'RITM', 'ID']);
              if (!id) return null;
              
              const comments = getValue(row, ['Delivery Comments', 'Comments', 'Notes']) || '';
              // Note: We don't have address in Orders_Tracking usually, but we might get it from Allocation merge later
              // For now, check comments for Pickup indicators
              const deliveryMethod = identifyDeliveryMethod(comments, '');

              return {
                id,
                date: parseExcelDate(getValue(row, ['Order Date', 'Date'])),
                startDate: parseExcelDate(getValue(row, ['Start Date'])),
                status: getValue(row, ['Status']) || 'Pending',
                deliveryDate: parseExcelDate(getValue(row, ['Delivery Date'])),
                type: getValue(row, ['Package Type', 'Type']) || 'Standard',
                recipientName: getValue(row, ['Recipient Name', 'Recipient']) || '',
                issue: categorizeIssue(comments),
                deliveryMethod: deliveryMethod,
                comments: comments
              };
            })
            .filter(Boolean) // Filter out nulls
            .map(o => ({
              ...o,
              days: o.deliveryDate && o.date ? Math.floor((new Date(o.deliveryDate) - new Date(o.date)) / (1000 * 60 * 60 * 24)) : 0
            }));
        }

        // 2. Parse Inventory_Master
        const invSheet = findSheet(workbook, ['Inventory_Master', 'Inventory Master', 'Inventory']);
        if (invSheet) {
          const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[invSheet]);
          rawInventory = sheet;
          
          // Parse Serialized Items
          parsed.inventory.serialized = sheet
            .map(row => {
              const sn = getValue(row, ['Serial Number', 'SN', 'Serial']);
              if (!sn) return null;

              return {
                sn,
                type: getValue(row, ['Asset Type', 'Type']) || 'Laptop',
                brand: getValue(row, ['Manufacturer', 'Brand']) || 'Unknown',
                model: getValue(row, ['Model']) || 'Unknown',
                status: getValue(row, ['Current Status', 'Status']) || 'In Stock',
                po: getValue(row, ['PO Number', 'PO']) || '',
                receivedDate: parseExcelDate(getValue(row, ['Date Received', 'Received Date'])),
                location: getValue(row, ['Storage Location', 'Location']) || ''
              };
            })
            .filter(Boolean);
            
          // Parse Bulk Items (Columns J-M)
          // Look for rows that have 'Bulk Item Name' and ignore the summary headers
          parsed.inventory.bulk = sheet
            .map(row => {
              const name = getValue(row, ['Bulk Item Name', 'Item Name', 'Item', 'Description']);
              if (!name || name === 'SUMMARY (Auto)') return null;
              
              // ROBUST STOCK PARSING: Prioritize "Current Stock"
              let stockVal = getValue(row, ['Current Stock', 'Stock', 'On Hand', 'Qty', 'Quantity', 'Balance', 'Qty On Hand']);
              let receivedVal = getValue(row, ['Total Received', 'Received', 'In']);
              let shippedVal = getValue(row, ['Total Shipped', 'Shipped', 'Out', 'Deployed']);

              let received = parseInt(receivedVal) || 0;
              let shipped = parseInt(shippedVal) || 0;
              
              // Use Stock Column if available, otherwise calculate
              let stock = 0;
              if (stockVal !== undefined && stockVal !== null && stockVal !== '') {
                  stock = parseInt(stockVal) || 0;
              } else {
                  stock = received - shipped;
              }

              return {
                name,
                received,
                shipped,
                stock
              };
            })
            .filter(Boolean);

          // Parse Receive Log (Cols O-R in specific layout)
          // Since key names might duplicate (e.g., 'PO Number'), sheet_to_json adds suffix like '_1'
          parsed.inventory.receiveLog = sheet
            .map(row => {
               // Look for the "Receive Log" columns which typically appear after the Bulk items
               // We look for keys with suffix '_1' or positionally if keys are unique
               
               // Try specific Receive Log column names based on user file analysis
               const po = getValue(row, ['PO Number_1', 'PO_1', 'PO Number.1', 'PO Number ']);
               const date = parseExcelDate(getValue(row, ['Date Received_1', 'Date_1', 'Date Received.1', 'Date Received ']));
               const type = getValue(row, ['Item Type', 'Item Type_1', 'Type_1', 'Item Type ']); 
               const qty = parseInteger(getValue(row, ['Qty Received', 'Qty Received_1', 'Qty_1', 'Qty Received ']));

               // If main key failed, try without suffix (in case sheet parser didn't dedupe or headers are unique enough)
               const poFallback = po || getValue(row, ['PO Number']);
               const dateFallback = date || parseExcelDate(getValue(row, ['Date Received']));
               // Note: 'Item Type' and 'Qty Received' are unique to this section in the sample, so no suffix might be needed
               const typeFallback = type || getValue(row, ['Item Type']);
               const qtyFallback = qty || parseInteger(getValue(row, ['Qty Received']));

               // We need at least PO and Type to make a link
               if (!typeFallback) return null; 

               return {
                 po: poFallback || '', 
                 date: dateFallback, 
                 type: typeFallback, 
                 qty: qtyFallback
               }
            })
            .filter(Boolean);
        }

        // 3. Parse PO_Info
        const poSheet = findSheet(workbook, ['PO_Info', 'PO Info', 'Financials', 'Purchase Orders']);
        if (poSheet) {
          const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[poSheet], { defval: "" }); // defval ensures all keys exist even if empty
          rawFinancials = sheet;
          
          parsed.financials = sheet
            .map(row => {
              // IMPORTANT: Using fuzzy match for 'PO Number' existence check
              const poVal = getValue(row, ['PO Number', 'PO #', 'PO', 'PO No', 'PO No.']);
              if (!poVal) return null;

              const dateVal = getValue(row, ['Order Date', 'Date']);
              const vendorVal = getValue(row, ['Vendor', 'Supplier']);
              
              // Expanded fuzzy search for Cost, PLUS fallback to empty string parsing
              let costVal = getValue(row, ['Cost', 'Amount', 'Total Cost', 'Unit Cost', 'Price', 'Value']);
              
              // Fallback: If fuzzy match failed, check if the "Cost" key exists but is strictly undefined
              if (costVal === undefined && row['Cost'] !== undefined) costVal = row['Cost'];

              const warrantyVal = getValue(row, ['Warranty End Date', 'Warranty End', 'Warranty']);
              
              // NEW: Parse Type for Consumables Calculation
              const typeVal = getValue(row, ['Type', 'Item Type', 'Asset Type', 'Category', 'Classification']);

              // NEW: Extract Description and Qty for FIFO matching
              const descVal = getValue(row, ['Description', 'Desc', 'Item Name', 'Item', 'Product', 'Details', 'Material', 'Material Description', 'Short Text', 'Part Number', 'Part #']);
              const qtyVal = getValue(row, ['Quantity', 'Qty', 'Count', 'Amount', 'Units', 'Quantity Ordered', 'Quant', 'Order Qty']);

              return {
                po: poVal,
                description: descVal || '',
                qty: parseInteger(qtyVal), // Default to 0 if not found, logic below handles 0->1 if needed
                type: typeVal || 'Unknown',
                date: parseExcelDate(dateVal),
                label: poVal,
                vendor: vendorVal || 'Unknown',
                cost: parseCurrency(costVal),
                warrantyEndDate: parseExcelDate(warrantyVal)
              };
            })
            .filter(Boolean);
        }

        // 4. Parse Allocation_Log
        const allocSheet = findSheet(workbook, ['Allocation_Log', 'Allocation Log', 'Allocations']);
        if (allocSheet) {
          const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[allocSheet]);
          rawAllocations = sheet;
          parsed.allocation = sheet
            .map(row => {
              const ritm = getValue(row, ['RITM#', 'RITM']);
              if (!ritm) return null;

              return {
                date: parseExcelDate(getValue(row, ['Start Date'])),
                ritm: ritm,
                user: getValue(row, ['User Name', 'User']) || '',
                laptop: getValue(row, ['Laptop SN', 'SN', 'Serial']) || '',
                items: getValue(row, ['Items']) || ''
              };
            })
            .filter(Boolean);
        }

        // 5. Parse Client Format (Optional - for viewing only)
        const clientSheet = findSheet(workbook, ['Client_Format', 'Client Format']);
        if (clientSheet) {
             parsed.client = XLSX.utils.sheet_to_json(workbook.Sheets[clientSheet]);
        }

        // DATA MERGING: Enrich orders with allocation and inventory details
        if (rawOrders.length > 0 && rawAllocations.length > 0) {
          // ... (Allocation and Inventory Linking Logic - No changes needed here) ...
          const allocMap = new Map(); // ritm -> allocation
          rawAllocations.forEach(a => {
            const ritm = a['RITM#'] || a['RITM'] || '';
            if (ritm) {
              if (!allocMap.has(ritm)) allocMap.set(ritm, []);
              allocMap.get(ritm).push(a);
            }
          });

          const invMap = new Map(); // serial number -> inventory
          parsed.inventory.serialized.forEach(inv => {
            const sn = inv.sn;
            if (sn) invMap.set(sn.toLowerCase(), inv);
          });

          const poMap = new Map(); // po number -> po info
          parsed.financials.forEach(po => {
            const poNum = po.po;
            if (poNum) poMap.set(poNum, po);
          });

          // Enrich orders
          parsed.orders = parsed.orders.map(order => {
            const allocations = allocMap.get(order.id) || [];
            const deployed = allocations.length > 0;
            const laptopSN = allocations.length > 0 ? (allocations[0]['Laptop SN'] || allocations[0]['Laptop']) : '';
            const invRecord = laptopSN ? invMap.get(laptopSN.toLowerCase()) : null;
            const poRecord = invRecord ? poMap.get(invRecord.po) : null;

            return {
              ...order,
              deployed,
              allocatedUser: allocations.length > 0 ? (allocations[0]['User Name'] || allocations[0]['User']) : '',
              allocatedLaptopSN: laptopSN,
              laptopModel: invRecord ? invRecord.model : '',
              laptopManufacturer: invRecord ? invRecord.brand : '',
              warrantyEndDate: poRecord ? poRecord.warrantyEndDate : '',
              vendor: poRecord ? poRecord.vendor : ''
            };
          });

          // Enrich inventory
          parsed.inventory.serialized = parsed.inventory.serialized.map(inv => {
            const poRecord = poMap.get(inv.po) || {};
            const allocation = rawAllocations.find(a => (a['Laptop SN'] || a['Laptop']) === inv.sn);
            return {
              ...inv,
              allocatedToRITM: allocation ? (allocation['RITM#'] || allocation['RITM']) : '',
              allocatedToUser: allocation ? (allocation['User Name'] || allocation['User']) : '',
              vendor: poRecord.vendor || '',
              cost: poRecord.cost || 0,
              warrantyEndDate: poRecord.warrantyEndDate || ''
            };
          });

          // NEW: Enrich Financials to calculate Total Spend (Unit Cost * Qty)
          parsed.financials = parsed.financials.map(po => {
             // 1. Try finding quantity in Receive Log (Bulk) for this PO
             const logQty = parsed.inventory.receiveLog
                .filter(log => log.po && po.po && log.po.trim().toLowerCase() === po.po.trim().toLowerCase())
                .reduce((sum, log) => sum + (log.qty || 0), 0);
             
             // 2. Try finding quantity in Serialized Inventory for this PO
             const serialQty = parsed.inventory.serialized
                .filter(item => item.po && po.po && item.po.trim().toLowerCase() === po.po.trim().toLowerCase())
                .length;

             // Use the largest quantity found (safe assumption if logs overlap or one is more complete)
             // If PO has explicit qty, include it in comparison
             const totalQty = Math.max(logQty, serialQty, po.qty || 0); 
             
             // If we found a quantity, calculate total. If not, fallback to 1 (assume unit cost = total cost)
             const finalQty = totalQty > 0 ? totalQty : 1; 
             
             return {
                 ...po,
                 qty: finalQty, // Update the displayed qty
                 totalCost: (po.cost || 0) * finalQty
             };
          });
        }

        let hasParsedData = (parsed.orders && parsed.orders.length) || (parsed.inventory.serialized && parsed.inventory.serialized.length) || (parsed.financials && parsed.financials.length);
        
        const errors = [];
        if (!hasParsedData) {
          errors.push('No recognized data found. Expected sheets: Orders_Tracking, Inventory_Master, PO_Info, Allocation_Log.');
        }

        setPreviewPayload(parsed);
        setValidationErrors(errors);
        setShowPreview(true);
      } catch (error) {
        alert(`❌ Error parsing Excel file: ${error.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!previewPayload) return;
    setOrdersData(previewPayload.orders || []);
    setInventoryData(previewPayload.inventory || { serialized: [], bulk: [], receiveLog: [] });
    setFinancialData(previewPayload.financials || []);
    setAllocationData(previewPayload.allocation || []);
    setClientData(previewPayload.client || []);
    setShowPreview(false);
    setPreviewPayload(null);
    // persist to localStorage
    try { localStorage.setItem('vdc-data', JSON.stringify({ orders: previewPayload.orders, inventory: previewPayload.inventory, financials: previewPayload.financials, allocation: previewPayload.allocation, client: previewPayload.client })); } catch (e) {}
    alert('✅ Data imported and saved locally');
  };

  const cancelImport = () => {
    setShowPreview(false);
    setPreviewPayload(null);
  };

  // --- MODIFIED EXPORT PDF TO USE REPORT VIEW ---
  const exportPDF = () => {
    if (!libsLoaded) {
      alert("PDF library is still loading...");
      return;
    }

    // Target the Report Container if visible, otherwise main dashboard
    const input = showReport ? reportRef.current : dashboardRef.current;
    if (!input) {
      alert("View not found for export");
      return;
    }
    
    // Use generic window objects
    window.html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const { jsPDF } = window.jspdf;
      // Set PDF page size based on what we are printing. 
      // If Report View (A4 size div), use A4. If Dashboard (wide), use generic.
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save('vdc-tracker-report.pdf');
    });
  };

  // --- DATA AGGREGATION LOGIC (Replaced old one) ---
  const filteredQBRData = useMemo(() => {
    const now = new Date(CURRENT_DATE);
    const currentYear = now.getFullYear();
    
    let filteredOrders = ordersData;
    let filteredFinancials = financialData;

    // Filter Logic
    if (qbrPeriod === 'YTD') {
      filteredOrders = ordersData.filter(o => new Date(o.date).getFullYear() === currentYear);
      filteredFinancials = financialData.filter(f => new Date(f.date).getFullYear() === currentYear);
    } else if (qbrPeriod === 'Last 30 Days') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filteredOrders = ordersData.filter(o => new Date(o.date) >= thirtyDaysAgo && new Date(o.date) <= now);
      filteredFinancials = financialData.filter(f => new Date(f.date) >= thirtyDaysAgo && new Date(f.date) <= now);
    } else if (qbrPeriod === 'Last 90 Days') {
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      filteredOrders = ordersData.filter(o => new Date(o.date) >= ninetyDaysAgo && new Date(o.date) <= now);
      filteredFinancials = financialData.filter(f => new Date(f.date) >= ninetyDaysAgo && new Date(f.date) <= now);
    }
    // 'All Time' returns everything

    // Chart Aggregation Logic
    const reportAggregatedOrders = {};
    filteredOrders.forEach(order => {
      const date = new Date(order.date); 
      if (isNaN(date.getTime())) return;
      
      // Auto-switch granularity based on period
      let key, sortKey;
      
      if (qbrPeriod === 'Last 30 Days') {
         // Daily
         key = `${date.getMonth()+1}/${date.getDate()}`;
         sortKey = date.getTime();
      } else {
         // Monthly (default for YTD/All/90)
         key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}`;
         sortKey = parseInt(`${date.getFullYear()}${String(date.getMonth()+1).padStart(2, '0')}`);
      }

      if (!reportAggregatedOrders[key]) reportAggregatedOrders[key] = { name: key, sortKey: sortKey, orders: 0 };
      reportAggregatedOrders[key].orders += 1;
    });
    
    const chartData = Object.values(reportAggregatedOrders).sort((a, b) => a.sortKey - b.sortKey);

    // Calculate metrics for Cards
    const totalSpend = filteredFinancials.reduce((acc, curr) => acc + (curr.totalCost || curr.cost), 0);
    const orderVolume = filteredOrders.length;
    
    // SLA Rate for this period
    const delivered = filteredOrders.filter(o => o.status === 'Delivered' && o.days !== null);
    const compliant = delivered.filter(o => (o.days || 0) <= slaDays).length;
    const slaRate = delivered.length ? Math.round((compliant / delivered.length) * 100) : 100;

    // Delivery Issues for this period
    const issueMap = filteredOrders.filter(o => o.issue).reduce((acc, curr) => {
        acc[curr.issue] = (acc[curr.issue] || 0) + 1;
        return acc;
    }, {});
    const issues = Object.keys(issueMap).map(key => ({ name: key, value: issueMap[key], color: '#94a3b8' })); // Simplify color for now

    // Delivery Method for this period
    const methodMap = { 'Direct': 0, 'Pickup': 0 };
    filteredOrders.forEach(o => methodMap[o.deliveryMethod] += 1);
    const methods = [
      { name: 'Direct to User', value: methodMap['Direct'], color: '#3b82f6' },
      { name: '3rd Party Pickup', value: methodMap['Pickup'], color: '#8b5cf6' }
    ].filter(i => i.value > 0);

    return { 
      orders: filteredOrders, 
      financials: filteredFinancials,
      chartData: chartData,
      metrics: { totalSpend, orderVolume, slaRate },
      issues,
      methods
    };
  }, [qbrPeriod, ordersData, financialData, slaDays]);

  // Use the same logic for Report View (filtering by reportPeriod)
  const filteredReportData = useMemo(() => {
     // Re-use logic above by calling it with reportPeriod
     // For simplicity in this file structure, I'll keep them separate or just ensure Report View uses its own state
     // We will leave the existing filteredReportData logic for the modal as is, to avoid breaking it.
     // ... (Existing logic for PDF modal remains below) ...
     const now = new Date(CURRENT_DATE);
     const currentYear = now.getFullYear();
     let filteredOrders = ordersData;
     let filteredFinancials = financialData;

     if (reportPeriod === 'YTD') {
       filteredOrders = ordersData.filter(o => new Date(o.date).getFullYear() === currentYear);
       filteredFinancials = financialData.filter(f => new Date(f.date).getFullYear() === currentYear);
     } else if (reportPeriod === 'Last 30 Days') {
       const thirtyDaysAgo = new Date(now);
       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
       filteredOrders = ordersData.filter(o => new Date(o.date) >= thirtyDaysAgo && new Date(o.date) <= now);
       filteredFinancials = financialData.filter(f => new Date(f.date) >= thirtyDaysAgo && new Date(f.date) <= now);
     } else if (reportPeriod === 'Last 90 Days') {
       const ninetyDaysAgo = new Date(now);
       ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
       filteredOrders = ordersData.filter(o => new Date(o.date) >= ninetyDaysAgo && new Date(o.date) <= now);
       filteredFinancials = financialData.filter(f => new Date(f.date) >= ninetyDaysAgo && new Date(f.date) <= now);
     } 

     const reportAggregatedOrders = {};
     filteredOrders.forEach(order => {
       const date = new Date(order.date); 
       if (isNaN(date.getTime())) return;
       const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}`;
       const sortKey = parseInt(`${date.getFullYear()}${String(date.getMonth()+1).padStart(2, '0')}`);
       if (!reportAggregatedOrders[key]) reportAggregatedOrders[key] = { name: key, sortKey: sortKey, orders: 0 };
       reportAggregatedOrders[key].orders += 1;
     });
     const chartData = Object.values(reportAggregatedOrders).sort((a, b) => a.sortKey - b.sortKey);

     return { orders: filteredOrders, financials: filteredFinancials, chartData: chartData };
  }, [reportPeriod, ordersData, financialData]);


  // --- HELPER FUNCTIONS FOR NEW FEATURES ---
  
  // 1. Feature 5: Logic for Breach List (SLA Rescue)
  const getBreachList = () => {
    return ordersData.filter(o => {
      if (o.status === 'Delivered') return false;
      const orderDate = new Date(o.date);
      const diffTime = CURRENT_DATE - orderDate; // Difference in milliseconds
      
      // If order is in the future relative to CURRENT_DATE, it's not a breach.
      if (diffTime < 0) return false;

      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays > slaDays; // Use state variable
    }).map(o => {
        const orderDate = new Date(o.date);
        const diffTime = Math.abs(CURRENT_DATE - orderDate);
        return { ...o, age: Math.ceil(diffTime / (1000 * 60 * 60 * 24)) };
    }).sort((a, b) => b.age - a.age); // Sort by oldest breach first
  };
  const breachList = getBreachList();

  // 2. Feature 1: Logic for Burn Rate & Depletion
  const getBurnRateMetrics = () => {
    // Calculate simple burn rate based on orders in last 30 days
    const thirtyDaysAgo = new Date(CURRENT_DATE);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // For weekly velocity, look at last 28 days (4 weeks) for cleaner math
    const twentyEightDaysAgo = new Date(CURRENT_DATE);
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    
    const recentOrders = ordersData.filter(o => {
      const d = new Date(o.date);
      return d >= thirtyDaysAgo && d <= CURRENT_DATE;
    });
    
    const ordersLast4Weeks = ordersData.filter(o => {
      const d = new Date(o.date);
      return d >= twentyEightDaysAgo && d <= CURRENT_DATE;
    });

    // Avg orders per day
    const burnRate = recentOrders.length / 30; // units/day
    
    // Avg orders per week (based on last 4 weeks)
    const weeklyVelocity = Math.round(ordersLast4Weeks.length / 4);
    
    // Total Laptop Stock
    const laptopStock = inventoryData.serialized
      .filter(i => i.type === 'Laptop' && i.status === 'In Stock')
      .reduce((acc, curr) => acc + 1, 0);

    const daysToDepletion = burnRate > 0 ? Math.floor(laptopStock / burnRate) : 999;
    
    return { burnRate: burnRate.toFixed(1), daysToDepletion, laptopStock, weeklyVelocity };
  };
  const { burnRate, daysToDepletion, laptopStock, weeklyVelocity } = getBurnRateMetrics();

  // 3. Feature 2: Logic for Aging Analysis
  const getInventoryAging = () => {
    const buckets = { '0-30 Days': 0, '31-60 Days': 0, '61-90 Days': 0, '90+ Days': 0 };
    
    inventoryData.serialized.filter(i => i.status === 'In Stock').forEach(item => {
      if (!item.receivedDate) return;
      const recDate = new Date(item.receivedDate);
      const diffTime = Math.abs(CURRENT_DATE - recDate);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (days <= 30) buckets['0-30 Days'] += 1;
      else if (days <= 60) buckets['31-60 Days'] += 1;
      else if (days <= 90) buckets['61-90 Days'] += 1;
      else buckets['90+ Days'] += 1;
    });

    return Object.keys(buckets).map(key => ({ name: key, count: buckets[key] }));
  };
  const agingData = getInventoryAging();

  // 4. Feature 3: Logic for Returns
  const getReturnsMetrics = () => {
    const pendingWipe = inventoryData.serialized
      .filter(i => i.status === 'Returned - Pending Wipe')
      .reduce((acc, curr) => acc + 1, 0);
      
    const repair = inventoryData.serialized
      .filter(i => i.status === 'Returned - Repair')
      .reduce((acc, curr) => acc + 1, 0);
      
    return { pendingWipe, repair };
  };
  const { pendingWipe, repair } = getReturnsMetrics();


  // --- STANDARD METRICS (based on enriched merged data) ---
  const processingCount = ordersData.filter(o => o.status === 'Processing').length;
  const shippedCount = ordersData.filter(o => o.status === 'Shipped').length;
  const deliveredCount = ordersData.filter(o => o.status === 'Delivered').length;
  
  // In Stock vs Deployed
  const inStockCount = inventoryData.serialized.filter(i => i.status === 'In Stock').length;
  const deployedCount = ordersData.filter(o => o.deployed).length;
  const totalAssets = inStockCount + deployedCount;
  const utilizationRate = totalAssets ? Math.round((deployedCount / totalAssets) * 100) : 0;

  // Capital Tied Up (Existing: Serialized)
  const capitalTiedUp = inventoryData.serialized
    .filter(i => i.status === 'In Stock')
    .reduce((acc, curr) => acc + (curr.cost || 0), 0);

  // Consumables Value Calculation (FIFO)
  // Logic: For each bulk item type, find matching POs via the Receive Log, sort by newest first.
  const consumablesMetrics = useMemo(() => {
    let totalValue = 0;
    let totalUnits = 0;
    const receiveLog = inventoryData.receiveLog || [];

    inventoryData.bulk.forEach(item => {
      const stockCount = item.stock; // Current remaining stock
      if (stockCount <= 0) return;
      
      totalUnits += stockCount;

      // Filter Receive Log for this specific item name
      // The receive log 'type' field should match the bulk item name
      const matchingLogs = receiveLog.filter(log => 
         log.type && item.name && log.type.toLowerCase().trim() === item.name.toLowerCase().trim()
      );

      if (matchingLogs.length === 0) return;

      // Sort logs by Date (Newest first)
      const sortedLogs = matchingLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

      let remainingStockToValue = stockCount;
      let itemValue = 0;

      for (const log of sortedLogs) {
        if (remainingStockToValue <= 0) break;

        // Find the PO in financials to get unit cost
        const poRecord = financialData.find(f => f.po && log.po && f.po.toLowerCase().trim() === log.po.toLowerCase().trim());
        
        // Use PO cost as Unit Cost. Default to 0 if not found.
        const unitCost = poRecord ? (poRecord.cost || 0) : 0;
        
        // Use the quantity from the RECEIVE LOG, not the PO (since PO Qty is missing in file)
        const logQty = log.qty || 0;
        
        // Take either the full log quantity or just what's needed to cover the remaining stock
        const take = Math.min(remainingStockToValue, logQty);
        
        itemValue += take * unitCost;
        remainingStockToValue -= take;
      }
      
      totalValue += itemValue;
    });

    return { value: totalValue, count: totalUnits };
  }, [inventoryData.bulk, inventoryData.receiveLog, financialData]);

  const consumablesValue = consumablesMetrics.value;
  const consumablesCount = consumablesMetrics.count;

  // Model Fragmentation (New)
  const uniqueModels = new Set(inventoryData.serialized.filter(i => i.status === 'In Stock').map(i => i.model)).size;

  // Recent Intake Volume (New Chart Data)
  const intakeData = useMemo(() => {
    const last30 = new Date(CURRENT_DATE);
    last30.setDate(last30.getDate() - 30);
    const counts = {};
    
    // Initialize dates
    for (let d = new Date(last30); d <= CURRENT_DATE; d.setDate(d.getDate() + 1)) {
       const dateStr = d.toISOString().split('T')[0];
       counts[dateStr] = 0;
    }

    inventoryData.serialized.forEach(item => {
      if (!item.receivedDate) return;
      const d = new Date(item.receivedDate);
      if (d >= last30 && d <= CURRENT_DATE) {
        const key = item.receivedDate;
        if (counts[key] !== undefined) counts[key] += 1;
      }
    });
    
    return Object.keys(counts).map(date => {
       const d = new Date(date);
       return { 
         date: `${d.getMonth()+1}/${d.getDate()}`, 
         count: counts[date],
         fullDate: date 
       };
    }).sort((a,b) => new Date(a.fullDate) - new Date(b.fullDate));
  }, [inventoryData]);

  // Pending Orders (Orders without deployment/allocation)
  const pendingOrdersCount = ordersData.filter(o => !o.deployed).length;

  // Warranty expiration status
  const upcomingWarrantyCount = inventoryData.serialized.filter(inv => {
    if (!inv.warrantyEndDate) return false;
    const warrantyDate = new Date(inv.warrantyEndDate);
    const thirtyDaysFromNow = new Date(CURRENT_DATE.getTime() + 30 * 24 * 60 * 60 * 1000);
    return warrantyDate >= CURRENT_DATE && warrantyDate <= thirtyDaysFromNow;
  }).length;

  const deliveredOrders = ordersData.filter(o => o.status === 'Delivered' && o.days !== null);
  const avgCycleTime = deliveredOrders.length ? (deliveredOrders.reduce((sum, o) => sum + (o.days || 0), 0) / deliveredOrders.length).toFixed(1) : 0;
  const slaCompliant = deliveredOrders.filter(o => (o.days || 0) <= slaDays).length; // Use state variable
  const slaRate = deliveredOrders.length ? Math.round((slaCompliant / deliveredOrders.length) * 100) : 100;

  // Delivery Issues Calculation (Based on keywords in 'issue' field)
  const deliveryIssues = useMemo(() => {
    // Collect all issues that are not null/undefined
    const issues = ordersData
      .filter(o => o.issue)
      .reduce((acc, curr) => {
        acc[curr.issue] = (acc[curr.issue] || 0) + 1;
        return acc;
      }, {});

    // Define colors for specific issues
    const colorMap = {
      'Address Change In Transit': '#8b5cf6', // Violet/Purple for this operational task
      'Wrong Address': '#ef4444', // Red
      'User Unavailable': '#f59e0b', // Amber
      'Damaged': '#dc2626', // Dark Red
      'Lost in Transit': '#7f1d1d', // Very Dark Red
      'Refused': '#f97316', // Orange
      'Carrier Delay': '#3b82f6', // Blue
      'Missing Item': '#ec4899', // Pink
      'Other Issue': '#64748b' // Slate
    };

    return Object.keys(issues).map(key => ({
      name: key,
      value: issues[key],
      color: colorMap[key] || '#94a3b8'
    }));
  }, [ordersData]);

  // Delivery Method Breakdown (New)
  const deliveryMethodData = useMemo(() => {
    const methods = { 'Direct': 0, 'Pickup': 0 };
    ordersData.forEach(o => {
      methods[o.deliveryMethod] += 1;
    });
    return [
      { name: 'Direct to User', value: methods['Direct'], color: '#3b82f6' },
      { name: '3rd Party Pickup', value: methods['Pickup'], color: '#8b5cf6' }
    ].filter(i => i.value > 0);
  }, [ordersData]);

  const filteredInventory = inventoryData.serialized.filter(item => 
    (item.type && item.type.toLowerCase().includes(invSearch.toLowerCase())) || 
    (item.brand && item.brand.toLowerCase().includes(invSearch.toLowerCase())) || 
    (item.model && item.model.toLowerCase().includes(invSearch.toLowerCase()))
  );

  // Trend Calculation for QBR
  const calculateOrderTrend = () => {
    if (!ordersData.length) return 0;
    
    // Sort orders by date
    const sorted = [...ordersData].sort((a,b) => new Date(a.date) - new Date(b.date));
    if (!sorted.length) return 0;

    const lastOrderDate = new Date(sorted[sorted.length - 1].date);
    const thirtyDaysAgo = new Date(lastOrderDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(lastOrderDate);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const currentPeriodCount = ordersData.filter(o => {
        const d = new Date(o.date);
        return d >= thirtyDaysAgo && d <= lastOrderDate;
    }).length;

    const prevPeriodCount = ordersData.filter(o => {
        const d = new Date(o.date);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).length;

    if (prevPeriodCount === 0) return 100; // technically infinite, but 100% growth for display
    return Math.round(((currentPeriodCount - prevPeriodCount) / prevPeriodCount) * 100);
  };
  
  const orderTrend = calculateOrderTrend();

  // --- RAW DATA SORTING & FILTERING HANDLERS ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // --- REPORT METRICS PREPARATION ---
  const reportMetrics = useMemo(() => {
    if (!filteredReportData) return null;

    // 1. SLA Metrics (Donut Chart)
    const delivered = filteredReportData.orders.filter(o => o.status === 'Delivered');
    const met = delivered.filter(o => (o.days || 0) <= slaDays).length;
    const missed = delivered.length - met;
    const slaData = [
      { name: 'Within SLA', value: met, color: '#22c55e' }, // Green
      { name: 'Missed SLA', value: missed, color: '#ef4444' } // Red
    ];
    const slaPercent = delivered.length ? Math.round((met / delivered.length) * 100) : 0;

    // 2. Spend by Vendor (Top 5 Bar Chart)
    const vendorMap = {};
    filteredReportData.financials.forEach(f => {
      const v = f.vendor || 'Unknown';
      vendorMap[v] = (vendorMap[v] || 0) + (f.totalCost || f.cost || 0);
    });
    const spendByVendor = Object.entries(vendorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 vendors

    // 3. Inventory Risks (Low Stock Alert)
    const lowStockItems = inventoryData.bulk
      .filter(i => i.stock < 50) // Threshold can be adjusted
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);

    return { slaData, slaPercent, spendByVendor, lowStockItems, totalDelivered: delivered.length };
  }, [filteredReportData, slaDays, inventoryData.bulk]);

  const renderContent = () => {
    switch (activeTab) {
      case 'daily':
        // NEW LOGIC: Sort Consumables by lowest percentage remaining (High Risk first)
        const criticalConsumables = [...inventoryData.bulk]
          .map(item => ({
            ...item,
            // Calculate percentage, guard against division by zero
            fillRate: item.received > 0 ? (item.stock / item.received) * 100 : 100
          }))
          .sort((a, b) => a.fillRate - b.fillRate) // Sort ascending (0% first)
          .slice(0, 4);

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
                      <p className="text-red-700 text-xs">These orders are past due ({'>'} {slaDays} days) and require immediate attention.</p>
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
              <Card title="Action Required" value={processingCount} subtext="Pending Orders" icon={Clock} colorClass="bg-orange-500 text-orange-500" tooltip="Orders currently in 'Processing' status awaiting fulfillment." />
              <Card title="In Transit" value={shippedCount} subtext="With Carrier" icon={Truck} colorClass="bg-blue-500 text-blue-500" tooltip="Orders marked as 'Shipped' but not yet 'Delivered'." />
              <Card title="SLA Breach Rate" value={`${(100 - slaRate).toFixed(1)}%`} subtext={`Missed ${slaDays}-Day SLA`} icon={AlertCircle} colorClass="bg-red-500 text-red-500" alert={100 - slaRate > 10} tooltip={`Percentage of orders delivered after ${slaDays} days.`} />
              <Card title="Available Assets" value={inStockCount} subtext="In Stock" icon={Briefcase} colorClass="bg-indigo-500 text-indigo-500" tooltip="Total count of serialized laptops currently marked 'In Stock'." />
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
                <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><Package className="w-4 h-4 text-slate-500" />Critical Consumables</h3>
                <div className="space-y-6">
                  {criticalConsumables.length > 0 ? criticalConsumables.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-semibold text-slate-700 truncate pr-2" title={item.name}>{item.name}</span>
                        <span className={`font-bold ${item.fillRate < 25 ? 'text-red-600' : 'text-slate-500'}`}>{item.stock} Units</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-500 ${item.fillRate < 25 ? 'bg-red-500' : item.fillRate < 50 ? 'bg-orange-400' : 'bg-slate-800'}`} 
                          style={{ width: `${Math.min(item.fillRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-slate-400 text-xs py-8 italic">No consumables data found</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'qbr':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <SectionHeader title="Strategic Review (QBR)" subtitle="Performance metrics and trends for external reporting" 
              action={<div className="flex gap-3"><PeriodSelector current={qbrPeriod} onChange={setQbrPeriod} /></div>} />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10"><p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Total Spend ({qbrPeriod})</p><h3 className="text-4xl font-bold tracking-tight">${filteredQBRData.metrics.totalSpend.toLocaleString()}</h3></div>
                <DollarSign className="absolute right-4 bottom-4 w-32 h-32 text-white opacity-5 transform rotate-12" />
              </div>
               {/* Moved Stock Forecast Card Here - NOTE: Stock is point-in-time, doesn't really filter well, but burn rate can use filter range if we wanted */}
               <Card 
                 title="Stock Forecast" 
                 value={`${daysToDepletion} Days`} 
                 subtext={daysToDepletion < 30 ? "Restock Required Soon" : "Healthy Levels"} 
                 icon={Hourglass} 
                 colorClass={daysToDepletion < 30 ? "bg-red-500 text-red-500" : "bg-green-500 text-green-500"} 
                 alert={daysToDepletion < 20}
                 tooltip="Estimated time until stock depletion based on current daily burn rate."
               />
              <Card title="Order Volume" value={filteredQBRData.metrics.orderVolume} subtext={qbrPeriod} icon={Layers} colorClass="bg-blue-500 text-blue-500" tooltip="Total number of orders received in the selected period." />
              <Card title="Delivery Success Rate" value={`${filteredQBRData.metrics.slaRate}%`} subtext={`Within ${slaDays} Days SLA`} icon={CheckCircle} colorClass="bg-green-500 text-green-500" tooltip="Percentage of orders delivered within the SLA timeframe." />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
              <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" />Distribution Trends ({qbrPeriod})</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredQBRData.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                <ResponsiveContainer width="100%" height="100%"><BarChart data={filteredQBRData.financials} barSize={40}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} prefix="$" /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none' }} formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']} /><Bar dataKey="totalCost" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80 flex flex-col justify-center items-center">
                <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2 w-full"><AlertCircle className="w-4 h-4 text-orange-500" />Delivery Issues Breakdown</h3>
                <div className="flex-1 w-full flex items-center justify-center">
                  {filteredQBRData.issues.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={filteredQBRData.issues}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {filteredQBRData.issues.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-slate-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p>No delivery issues recorded in this period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* New Section: Delivery Method Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-64">
                 <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" />Delivery Method Preference</h3>
                 {filteredQBRData.methods.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={filteredQBRData.methods} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={100} />
                       <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                       <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={30}>
                         {filteredQBRData.methods.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="h-full flex items-center justify-center text-slate-400 text-sm">No delivery method data available</div>
                 )}
               </div>
               
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-64 flex flex-col">
                 <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Truck className="w-4 h-4 text-slate-500" />3rd Party Pickup Performance</h3>
                 <div className="flex-1 flex flex-col justify-center gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                       <span className="text-sm font-medium text-slate-600">Total Pickup Orders</span>
                       <span className="text-2xl font-bold text-slate-800">{filteredQBRData.methods.find(d => d.name === '3rd Party Pickup')?.value || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                       <span className="text-sm font-medium text-red-700">Pickup Issues</span>
                       <span className="text-2xl font-bold text-red-800">
                         {filteredQBRData.orders.filter(o => o.deliveryMethod === 'Pickup' && o.issue).length}
                       </span>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <SectionHeader title="Inventory Master" subtitle="Real-time stockroom levels, assignments, and locations" action={<div className="relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Filter by Brand, Model..." value={invSearch} onChange={(e) => setInvSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white" /></div>} />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
               <Card title="Current Stock" value={laptopStock} subtext="Laptops (US-NA)" icon={Briefcase} colorClass="bg-blue-500 text-blue-500" tooltip="Total count of serialized laptops currently marked 'In Stock'." />
               
               {/* 1. Capital Tied Up in Stock */}
               <Card 
                 title="Hardware Equity" 
                 value={`$${capitalTiedUp.toLocaleString()}`} 
                 subtext="Serialized Asset Value" 
                 icon={DollarSign} 
                 colorClass="bg-emerald-500 text-emerald-500" 
                 tooltip="Total value of serialized inventory currently in stock."
               />

               {/* New: Consumables Value (FIFO) */}
               <Card 
                 title="Consumables Value (FIFO)" 
                 value={`$${consumablesValue.toLocaleString()}`} 
                 subtext={`${consumablesCount} Items On Hand`}
                 icon={Package} 
                 colorClass="bg-purple-500 text-purple-500" 
                 tooltip="Estimated value of bulk consumables using First-In-First-Out logic."
               />
               
               {/* Changed to Weekly Velocity */}
               <Card 
                 title="Shipping Velocity" 
                 value={`${weeklyVelocity} / Week`} 
                 subtext={`~${burnRate} Daily Average`} 
                 icon={TrendingUp} 
                 colorClass="bg-orange-500 text-orange-500" 
                 tooltip="Average number of orders shipped per week over the last 4 weeks."
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 space-y-6">
                 
                 {/* 4. Recent Intake Volume Chart */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-64">
                   <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Download className="w-4 h-4 text-slate-500" />Recent Intake Volume (30 Days)</h3>
                   {intakeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={intakeData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                   ) : (
                     <div className="h-full flex items-center justify-center text-slate-400 text-sm">No stock received in last 30 days</div>
                   )}
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                   <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-600 border-b border-slate-200"><tr><th className="px-6 py-3 font-bold uppercase text-xs">Asset Type</th><th className="px-6 py-3 font-bold uppercase text-xs">Brand</th><th className="px-6 py-3 font-bold uppercase text-xs">Model</th><th className="px-6 py-3 font-bold uppercase text-xs text-right">In Stock</th><th className="px-6 py-3 font-bold uppercase text-xs text-right">Assigned</th><th className="px-6 py-3 font-bold uppercase text-xs text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-50">{filteredInventory.length === 0 ? (<tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400 italic">No assets found matching filter</td></tr>) : (Array.from(new Set(filteredInventory.map(i => `${i.type}|${i.brand}|${i.model}`))).map((key) => { 
                      const [type, brand, model] = key.split('|'); 
                      const items = filteredInventory.filter(i => i.type === type && i.brand === brand && i.model === model); 
                      
                      // Helper: Sum counts by status prefix
                      const getCount = (statusCheck) => items.filter(i => statusCheck(i.status)).length;

                      const inStock = getCount(s => s === 'In Stock');
                      const assigned = getCount(s => s === 'Assigned');
                      const returns = getCount(s => s && s.includes('Returned')); // Count all return types

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
                {[
                  { label: 'Orders', value: 'orders' },
                  { label: 'Inventory', value: 'inventory' },
                  { label: 'Financials', value: 'financials' },
                  { label: 'Allocation', value: 'allocation' },
                  { label: 'Client Format', value: 'client_format' }
                ].map((tab) => ( 
                  <button 
                    key={tab.value} 
                    onClick={() => { setDataView(tab.value); setSortConfig({key: null, direction: 'asc'}); setDataSearch(''); }} 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${dataView === tab.value ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    {tab.label}
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
      
      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[110] p-8 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600"/> Dashboard Settings</h2>
            
            <div className="space-y-6">
              {/* SLA Config */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery SLA Threshold (Days)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="1" 
                    max="30"
                    value={slaDays} 
                    onChange={(e) => setSlaDays(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-center"
                  />
                  <span className="text-sm text-slate-500">Days allowed for delivery</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Affects breach list, success rate, and alerts.</p>
              </div>

              {/* Branding Config */}
              <div className="border-t border-slate-100 pt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Branding (Report View)</label>
                <div className="flex flex-col gap-3">
                  {customLogo ? (
                    <div className="relative group w-fit">
                      <img src={customLogo} alt="Logo Preview" className="h-12 object-contain border border-slate-100 rounded p-1 bg-white" />
                      <button onClick={removeLogo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                    </div>
                  ) : (
                    <div className="h-12 w-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400">
                      No Logo
                    </div>
                  )}
                  
                  <label className="cursor-pointer bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 w-fit transition-colors">
                    <ImageIcon className="w-4 h-4" /> Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  <p className="text-xs text-slate-400">Upload a PNG or JPG. This will appear on PDF headers.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={() => setShowSettings(false)} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 text-sm">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT VIEW MODAL - REFACTORED FOR ENHANCED UI */}
      {showReport && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex justify-center overflow-auto py-8">
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl relative flex flex-col mx-auto" ref={reportRef}>
            {/* Report Toolbar */}
            <div className="absolute top-0 right-0 -mt-12 flex gap-2">
               <div className="bg-white rounded-lg shadow-sm p-1 flex items-center border border-slate-200 mr-2">
                  {['YTD', 'Last 30 Days', 'Last 90 Days', 'All Time'].map(p => (
                    <button 
                      key={p} 
                      onClick={() => setReportPeriod(p)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${reportPeriod === p ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {p}
                    </button>
                  ))}
               </div>
               <button onClick={() => setShowReport(false)} className="bg-white text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-slate-50 flex items-center gap-2">
                 <X className="w-4 h-4"/> Close Preview
               </button>
               <button onClick={exportPDF} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 flex items-center gap-2">
                 <Download className="w-4 h-4"/> Download PDF
               </button>
            </div>

            <div className="p-[15mm] flex-1 flex flex-col text-slate-900">
               {/* Header - Now Custom Branded */}
               <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                 <div>
                   {customLogo ? (
                     <img src={customLogo} alt="Company Logo" className="h-16 object-contain mb-2" />
                   ) : (
                     <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">VDC Strategy Report</h1>
                   )}
                   <p className="text-slate-500 text-sm mt-1">{customLogo ? "VDC Strategy Report • " : ""}Generated on {new Date().toLocaleDateString()}</p>
                 </div>
                 <div className="text-right">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Period</div>
                   <div className="text-lg font-semibold">{reportPeriod}</div>
                 </div>
               </div>

               {/* Row 1: Executive Summary Cards */}
               <div className="mb-8">
                 <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Executive Summary</h2>
                 <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Total Spend</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">${filteredReportData.financials.reduce((acc, curr) => acc + (curr.totalCost || curr.cost), 0).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 mt-1">CapEx committed in {reportPeriod}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Service Level (SLA)</p>
                      <p className={`text-2xl font-bold mt-1 ${reportMetrics.slaPercent < 90 ? 'text-red-600' : 'text-green-600'}`}>{reportMetrics.slaPercent}%</p>
                      <p className="text-[10px] text-slate-400 mt-1">{slaDays}-Day Delivery Target</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Runway Forecast</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{daysToDepletion} Days</p>
                      <p className={`text-[10px] mt-1 font-medium ${daysToDepletion < 30 ? 'text-red-600' : 'text-green-600'}`}>{daysToDepletion < 30 ? "Restock Critical" : "Healthy Supply"}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Order Velocity</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{weeklyVelocity}/wk</p>
                      <p className="text-[10px] mt-1 text-slate-400">~{burnRate} daily avg</p>
                    </div>
                 </div>
               </div>

               {/* Row 2: Charts - Financial & SLA */}
               <div className="grid grid-cols-2 gap-8 mb-8">
                 {/* Spend by Vendor */}
                 <div>
                   <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Strategic Partnerships (Spend)</h2>
                   <div className="h-64 border border-slate-100 rounded-lg p-4 bg-white">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportMetrics.spendByVendor} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none' }} formatter={(value) => [`$${value.toLocaleString()}`, 'Spend']} />
                          <Bar dataKey="value" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                   <p className="text-[10px] text-slate-500 mt-2">
                     Top 5 vendors by capital expenditure. Focuses on key hardware and logistics partners during the period.
                   </p>
                 </div>
                 
                 {/* SLA Performance */}
                 <div>
                   <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">SLA Compliance ({slaDays}-Day)</h2>
                   <div className="h-64 border border-slate-100 rounded-lg p-4 bg-white flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportMetrics.slaData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                          >
                            {reportMetrics.slaData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                         <span className="text-3xl font-bold text-slate-800">{reportMetrics.slaPercent}%</span>
                         <span className="text-[10px] text-slate-400 uppercase">Success Rate</span>
                      </div>
                   </div>
                   <p className="text-[10px] text-slate-500 mt-2">
                     Delivery performance against the defined {slaDays}-day Service Level Agreement.
                   </p>
                 </div>
               </div>

               {/* Row 3: Operational Trends */}
               <div className="mb-8">
                   <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Operational Velocity Trends</h2>
                   <div className="h-48 border border-slate-100 rounded-lg p-4 bg-white">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredReportData.chartData}>
                          <defs><linearGradient id="colorOrdersPrint" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/><stop offset="95%" stopColor="#0f172a" stopOpacity={0}/></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                          <Area type="monotone" dataKey="orders" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorOrdersPrint)" />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
               </div>

               {/* Row 4: Inventory Risk Table */}
               <div className="flex-1">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                    <span>Critical Stock / Risk Analysis</span>
                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded">Action Required: {reportMetrics.lowStockItems.length} Items</span>
                  </h2>
                  <div className="border border-slate-100 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="px-4 py-2">Item Name</th>
                          <th className="px-4 py-2 text-right">Current Stock</th>
                          <th className="px-4 py-2 text-right">Received</th>
                          <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportMetrics.lowStockItems.length > 0 ? reportMetrics.lowStockItems.map((item, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 font-medium text-slate-700">{item.name}</td>
                            <td className="px-4 py-2 text-right font-bold text-slate-900">{item.stock}</td>
                            <td className="px-4 py-2 text-right text-slate-500">{item.received}</td>
                            <td className="px-4 py-2 text-right">
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Low Stock</span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="px-4 py-4 text-center text-slate-400 text-xs italic">No critical stock levels detected.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>

               {/* Footer */}
               <div className="mt-8 border-t border-slate-100 pt-4 flex justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                 <span>VDC Distribution Tracker</span>
                 <span>Confidential - Internal Use Only</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {showDeploymentInfo && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-8 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button onClick={() => setShowDeploymentInfo(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Shield className="text-blue-600"/> Security & App Guide</h2>
            <div className="space-y-5 text-sm text-slate-600">
              
              {/* Security Section */}
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><Server className="w-4 h-4"/> Data Privacy & Security</h3>
                <p>This application runs <strong>100% locally in your browser</strong>. Your sensitive Excel data is parsed on your device and is <span className="underline">never</span> uploaded to any cloud server. It is safe to use with confidential client data.</p>
              </div>

              {/* How it Works Section */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">How it Works</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <h4 className="font-semibold text-slate-800 mb-1">1. Data Source</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Upload your VDC tracking Excel file. The app validates sheets (<code>Orders_Tracking</code>, <code>Inventory_Master</code>, etc.) and links them automatically.</p>
                   </div>
                   <div>
                      <h4 className="font-semibold text-slate-800 mb-1">2. Daily Management</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Use <strong>Daily Ops</strong> for immediate tasks like unfulfilled orders or SLA breaches. Check <strong>Inventory</strong> for real-time stock levels.</p>
                   </div>
                   <div>
                      <h4 className="font-semibold text-slate-800 mb-1">3. Executive Reporting</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Navigate to <strong>Strategic Review</strong> to visualize spending and SLA trends. Click "Print Report" to generate a PDF for stakeholders.</p>
                   </div>
                   <div>
                      <h4 className="font-semibold text-slate-800 mb-1">4. Smart Settings</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Adjust your SLA definitions (e.g., 5 days vs 3 days) and upload custom logos in <strong>Settings</strong> to personalize the dashboard.</p>
                   </div>
                </div>
              </div>

              {/* Technical Footnote */}
              <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400">
                 <strong>Technical Note:</strong> This is a static React application. It persists data to your browser's local storage automatically. To deploy, simply host the build files on SharePoint, Azure Static Web Apps, or any web server.
              </div>
            </div>
            <div className="mt-6 flex justify-end"><button onClick={() => setShowDeploymentInfo(false)} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800">Understood</button></div>
          </div>
        </div>
      )}
      {showPreview && previewPayload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6">
            <h3 className="text-lg font-bold mb-2">Import Preview</h3>
            {validationErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-100 rounded mb-4 text-sm text-red-700">{validationErrors.map((v,i)=> <div key={i}>{v}</div>)}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-semibold">Orders ({previewPayload.orders.length})</h4>
                <div className="text-xs text-slate-600 mt-2 max-h-40 overflow-auto border p-2 rounded">
                  {previewPayload.orders.slice(0,10).map((r,i)=> (
                    <div key={i} className="mb-1">{r.id || '-'} — {r.date || '-'} — {r.status || '-'}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Inventory ({previewPayload.inventory.serialized.length})</h4>
                <div className="text-xs text-slate-600 mt-2 max-h-40 overflow-auto border p-2 rounded">
                  {previewPayload.inventory.serialized.slice(0,10).map((r,i)=> (
                    <div key={i} className="mb-1">{r.type || '-'} — {r.brand || '-'} — {r.model || '-'}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={cancelImport} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={confirmImport} className="px-4 py-2 rounded bg-blue-600 text-white">Import</button>
            </div>
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
           <button onClick={() => setShowDeploymentInfo(true)} className="mt-3 w-full flex items-center justify-center gap-2 text-[10px] text-slate-500 hover:text-white transition-colors"><Info className="w-3 h-3"/> Security & Guide</button>
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
             <button onClick={() => setShowSettings(true)} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 group"><Settings className="w-4 h-4 group-hover:text-blue-600" /> </button>
             <button onClick={() => setShowReport(true)} disabled={!hasAnyData} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 group"><Printer className="w-4 h-4 group-hover:text-blue-600" /> <span className="hidden md:inline text-sm font-medium">Print Report</span></button>
             <div className="relative group">
                <input type="file" accept=".xlsx" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                <button disabled={!libsLoaded} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all hover:shadow-md group-active:scale-95"><Upload className="w-4 h-4" /> {fileName ? "File Loaded" : libsLoaded ? "Upload Excel" : "Loading Libs..."}</button>
             </div>
           </div>
        </header>
        { !hasAnyData ? (
          <div className="min-h-[500px] flex items-center justify-center">
            <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-md border border-slate-100 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No data yet</h2>
              <p className="text-slate-500 mb-6">Upload an Excel file to populate the dashboard with Orders, Inventory, Financials and Allocation sheets.</p>
              <div className="flex items-center justify-center gap-3">
                <label className={`relative inline-flex ${libsLoaded ? 'cursor-pointer' : 'cursor-wait'}`}>
                  <input type="file" accept=".xlsx" onChange={handleFileUpload} disabled={!libsLoaded} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <span className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-sm hover:bg-blue-700 ${!libsLoaded ? 'opacity-50' : ''}`}>{libsLoaded ? "Upload Excel" : "Initializing..."}</span>
                </label>
                <button onClick={() => setShowDeploymentInfo(true)} className="px-4 py-3 border rounded-lg text-sm">How it works</button>
              </div>
              <p className="text-xs text-slate-400 mt-4">Expected sheets: <strong>Orders_Tracking</strong>, <strong>Inventory_Master</strong>, <strong>PO_Info</strong>, <strong>Allocation_Log</strong></p>
            </div>
          </div>
        ) : (
          <div className="min-h-[500px]">{renderContent()}</div>
        )}
      </main>
    </div>
  );
}