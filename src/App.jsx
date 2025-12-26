import Header from './components/Header'
import Card from './components/Card'
import './App.css'

function App() {
  const dashboardData = {
    totalUsers: {
      title: 'Total Users',
      value: '12,345',
      subtitle: 'Active users',
      trend: { type: 'up', value: '+12.5%' },
      icon: '👥'
    },
    revenue: {
      title: 'Revenue',
      value: '$45,678',
      subtitle: 'This month',
      trend: { type: 'up', value: '+8.2%' },
      icon: '💰'
    },
    projects: {
      title: 'Active Projects',
      value: '89',
      subtitle: 'In progress',
      trend: { type: 'down', value: '-3.1%' },
      icon: '📊'
    },
    tasks: {
      title: 'Completed Tasks',
      value: '1,234',
      subtitle: 'This week',
      trend: { type: 'up', value: '+15.3%' },
      icon: '✅'
    }
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="dashboard-container">
          <section className="dashboard-section">
            <h2 className="section-title">Overview</h2>
            <div className="cards-grid">
              {Object.values(dashboardData).map((data, index) => (
                <Card
                  key={index}
                  title={data.title}
                  value={data.value}
                  subtitle={data.subtitle}
                  trend={data.trend}
                  icon={data.icon}
                />
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="section-title">Quick Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Average Response Time</h3>
                <p className="stat-value">2.3s</p>
              </div>
              <div className="stat-card">
                <h3>System Uptime</h3>
                <p className="stat-value">99.9%</p>
              </div>
              <div className="stat-card">
                <h3>Customer Satisfaction</h3>
                <p className="stat-value">4.8/5.0</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
