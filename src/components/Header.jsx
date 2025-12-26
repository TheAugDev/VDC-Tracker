import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">VDC Tracker Dashboard</h1>
        <nav className="header-nav">
          <a href="#overview">Overview</a>
          <a href="#analytics">Analytics</a>
          <a href="#reports">Reports</a>
          <a href="#settings">Settings</a>
        </nav>
      </div>
    </header>
  )
}

export default Header
