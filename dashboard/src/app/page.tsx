'use client'
import { useState, useEffect } from 'react';
import { Bell, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';

// Define our data types
type MetricStatus = 'normal' | 'warning' | 'critical';
type MetricType = 'temperature' | 'traffic' | 'visitors';

interface Metric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  status: MetricStatus;
  threshold: {
    warning: number;
    critical: number;
  };
  history: { time: string; value: number }[];
}

interface Alert {
  id: string;
  metricId: string;
  metricName: string;
  message: string;
  status: MetricStatus;
  timestamp: Date;
  acknowledged: boolean;
}

// Mock data generator function
const generateRandomData = (metrics: Metric[]): Metric[] => {
  return metrics.map(metric => {
    let newValue: number;
    
    // Generate value changes based on the metric type
    switch (metric.type) {
      case 'temperature':
        // Temperature fluctuates less dramatically
        newValue = metric.value + (Math.random() * 2 - 1);
        break;
      case 'traffic':
        // Traffic can spike more
        newValue = metric.value + (Math.random() * 20 - 10);
        break;
      case 'visitors':
        // Visitors change in smaller increments
        newValue = metric.value + (Math.random() * 6 - 3);
        break;
      default:
        newValue = metric.value;
    }
    
    // Ensure values don't go below zero
    newValue = Math.max(0, newValue);
    
    // Determine status based on thresholds
    let status: MetricStatus = 'normal';
    if (newValue >= metric.threshold.critical) {
      status = 'critical';
    } else if (newValue >= metric.threshold.warning) {
      status = 'warning';
    }
    
    // Add to history
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    const newHistory = [...metric.history, { time: timeStr, value: newValue }];
    
    // Keep only the last 10 data points for the chart
    if (newHistory.length > 10) {
      newHistory.shift();
    }
    
    return {
      ...metric,
      value: Math.round(newValue * 10) / 10, // Round to 1 decimal
      status,
      history: newHistory
    };
  });
};

// Function to check if new alerts should be generated
const checkForAlerts = (metrics: Metric[], currentAlerts: Alert[]): Alert[] => {
  const newAlerts: Alert[] = [];
  
  metrics.forEach(metric => {
    if (metric.status === 'warning' && !currentAlerts.some(alert => 
      alert.metricId === metric.id && alert.status === 'warning' && !alert.acknowledged
    )) {
      newAlerts.push({
        id: `alert-${metric.id}-${Date.now()}`,
        metricId: metric.id,
        metricName: metric.name,
        message: `${metric.name} is approaching critical level (${metric.value}${metric.unit})`,
        status: 'warning',
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    if (metric.status === 'critical' && !currentAlerts.some(alert => 
      alert.metricId === metric.id && alert.status === 'critical' && !alert.acknowledged
    )) {
      newAlerts.push({
        id: `alert-${metric.id}-${Date.now()}`,
        metricId: metric.id,
        metricName: metric.name,
        message: `${metric.name} has exceeded critical threshold (${metric.value}${metric.unit})`,
        status: 'critical',
        timestamp: new Date(),
        acknowledged: false
      });
    }
  });
  
  return [...currentAlerts, ...newAlerts];
};

// Get the color for a status
const getStatusColor = (status: MetricStatus) => {
  switch (status) {
    case 'normal':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'critical':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

// Format timestamp for alerts
const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Simple chart component
const SimpleChart = ({ data, maxValue }: { data: { time: string; value: number }[], maxValue: number }) => {
  if (data.length < 2) return <div className="h-64 flex items-center justify-center text-gray-500">Collecting data...</div>;
  
  // Simplified chart implementation with bars instead of line
  return (
    <div className="h-64 flex flex-col">
      {/* Chart title and legend */}
      <div className="mb-2 flex justify-between items-center">
        <div className="text-sm font-medium">Real-time values</div>
        <div className="text-xs text-gray-500">Last 10 data points</div>
      </div>
      
      {/* Chart container */}
      <div className="flex-1 flex items-end space-x-1">
        {data.map((point, index) => {
          // Calculate height percentage based on value
          const heightPercent = Math.min(100, (point.value / maxValue) * 100);
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex justify-center mb-1">
                <div 
                  className="bg-blue-500 rounded-t"
                  style={{ height: `${heightPercent}%`, width: '80%', minHeight: '4px' }}
                ></div>
              </div>
              {/* Only show every other time label to avoid crowding */}
              {index % 2 === 0 && (
                <div className="text-xs text-gray-500 truncate w-full text-center">
                  {point.time.split(':').slice(0, 2).join(':')}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Value indicators on the left */}
      <div className="absolute left-0 h-48 flex flex-col justify-between text-xs text-gray-500 pointer-events-none">
        <div>{Math.round(maxValue)}</div>
        <div>{Math.round(maxValue / 2)}</div>
        <div>0</div>
      </div>
    </div>
  );
};

// Dashboard component
export default function Dashboard() {
  // Initialize with some mock metrics
  const initialMetrics: Metric[] = [
    {
      id: 'temp-server-room',
      name: 'Server Room Temperature',
      type: 'temperature',
      value: 22.5,
      unit: '°C',
      status: 'normal',
      threshold: {
        warning: 25,
        critical: 30
      },
      history: []
    },
    {
      id: 'network-traffic',
      name: 'Network Traffic',
      type: 'traffic',
      value: 42,
      unit: 'Mbps',
      status: 'normal',
      threshold: {
        warning: 80,
        critical: 95
      },
      history: []
    },
    {
      id: 'active-visitors',
      name: 'Active Website Visitors',
      type: 'visitors',
      value: 156,
      unit: '',
      status: 'normal',
      threshold: {
        warning: 500,
        critical: 1000
      },
      history: []
    }
  ];
  
  const [metrics, setMetrics] = useState<Metric[]>(initialMetrics);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  
  // Update data every 2 seconds
  useEffect(() => {
    // Initialize history for each metric with multiple data points to show chart immediately
    setMetrics(metrics => {
      return metrics.map(metric => {
        const initialHistory = [];
        // Create some initial history points so we don't have to wait to see the chart
        for (let i = 9; i >= 0; i--) {
          const time = new Date();
          time.setSeconds(time.getSeconds() - i * 2);
          const timeStr = time.toLocaleTimeString();
          const randomOffset = Math.random() * 5 - 2.5; // Small random variation
          initialHistory.push({ 
            time: timeStr, 
            value: metric.value + randomOffset
          });
        }
        return {
          ...metric,
          history: initialHistory
        };
      });
    });
    
    const interval = setInterval(() => {
      setMetrics(prevMetrics => {
        const updatedMetrics = generateRandomData(prevMetrics);
        setAlerts(prevAlerts => checkForAlerts(updatedMetrics, prevAlerts));
        return updatedMetrics;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Set the first metric as selected initially
  useEffect(() => {
    if (metrics.length > 0 && !selectedMetric) {
      setSelectedMetric(metrics[0]);
    }
  }, [metrics, selectedMetric]);
  
  // Handle acknowledging alerts
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };
  
  // Function to check if metric value is increasing or decreasing
  const getTrend = (metric: Metric) => {
    if (metric.history.length < 2) return null;
    
    const current = metric.history[metric.history.length - 1].value;
    const previous = metric.history[metric.history.length - 2].value;
    
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Real-Time Monitoring Dashboard</h1>
        <p className="text-gray-300">Live monitoring of system metrics</p>
      </header>
      
      {/* Main content */}
      <div className="flex flex-col lg:flex-row flex-1 p-4 gap-4 overflow-y-auto">
        {/* Left column - Metrics */}
        <div className="lg:w-2/3 flex flex-col gap-4">
          {/* Metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map(metric => (
              <div 
                key={metric.id} 
                className={`bg-white p-4 rounded-lg shadow-md cursor-pointer border-l-4 ${getStatusColor(metric.status).replace('bg-', 'border-')}`}
                onClick={() => setSelectedMetric(metric)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-600">{metric.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(metric.status)}`}></div>
                </div>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-bold">{metric.value}</span>
                  <span className="ml-1 text-gray-600">{metric.unit}</span>
                  
                  {getTrend(metric) === 'up' && (
                    <ArrowUp className="ml-2 text-red-500" size={16} />
                  )}
                  {getTrend(metric) === 'down' && (
                    <ArrowDown className="ml-2 text-green-500" size={16} />
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Warning: {metric.threshold.warning}{metric.unit} | 
                  Critical: {metric.threshold.critical}{metric.unit}
                </div>
              </div>
            ))}
          </div>
          
          {/* Selected metric chart */}
          {selectedMetric && (
            <div className="bg-white p-4 rounded-lg shadow-md flex-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{selectedMetric.name} - Trend</h2>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedMetric.status)} mr-2`}></div>
                  <span className="text-sm capitalize">{selectedMetric.status}</span>
                </div>
              </div>
              
              <div className="relative px-8">
                <SimpleChart 
                  data={selectedMetric.history} 
                  maxValue={selectedMetric.threshold.critical * 1.2} 
                />
                
                {/* Threshold lines */}
                <div 
                  className="absolute left-8 right-0 border-t-2 border-red-400 border-dashed pointer-events-none"
                  style={{ 
                    top: `${100 - (selectedMetric.threshold.critical / (selectedMetric.threshold.critical * 1.2) * 100)}%`, 
                    height: '1px'
                  }}
                >
                  <span className="absolute left-0 top-0 transform -translate-y-1/2 text-xs text-red-500 ml-1 bg-white px-1">
                    Critical: {selectedMetric.threshold.critical}{selectedMetric.unit}
                  </span>
                </div>
                
                <div 
                  className="absolute left-8 right-0 border-t-2 border-yellow-400 border-dashed pointer-events-none"
                  style={{ 
                    top: `${100 - (selectedMetric.threshold.warning / (selectedMetric.threshold.critical * 1.2) * 100)}%`,
                    height: '1px'
                  }}
                >
                  <span className="absolute left-0 top-0 transform -translate-y-1/2 text-xs text-yellow-500 ml-1 bg-white px-1">
                    Warning: {selectedMetric.threshold.warning}{selectedMetric.unit}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right column - Alerts */}
        <div className="lg:w-1/3 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center mb-4">
            <Bell className="text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold">Recent Alerts</h2>
          </div>
          
          <div className="space-y-3 max-h-full overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No alerts to display</p>
              </div>
            ) : (
              alerts
                .filter(alert => !alert.acknowledged)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 10)
                .map(alert => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-md border-l-4 ${
                      alert.status === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <AlertTriangle className={`${
                          alert.status === 'critical' ? 'text-red-500' : 'text-yellow-500'
                        } mr-2 mt-1`} size={16} />
                        <div>
                          <p className="font-medium">{alert.metricName}</p>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTimestamp(alert.timestamp)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}