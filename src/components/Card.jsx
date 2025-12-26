import './Card.css'

function Card({ title, value, subtitle, trend, icon }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {icon && <span className="card-icon">{icon}</span>}
      </div>
      <div className="card-content">
        <div className="card-value">{value}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
        {trend && (
          <div className={`card-trend ${trend.type}`}>
            <span className="trend-arrow">{trend.type === 'up' ? '↑' : '↓'}</span>
            <span className="trend-value">{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Card
