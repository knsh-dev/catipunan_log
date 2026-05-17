// client/src/components/SalesBarChart.jsx
import '../styles/SalesBarChart.css';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// log_date may be 'YYYY-MM-DD' (daily) or 'YYYY-MM' (monthly)
function formatLabel(dateStr) {
  if (!dateStr) return { primary: '—', secondary: '' };
  // Monthly format: YYYY-MM
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [yr, mo] = dateStr.split('-');
    return { primary: MONTH_NAMES[parseInt(mo, 10) - 1], secondary: yr };
  }
  // Daily format
  const d = new Date(dateStr + 'T00:00:00');
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return { primary: DAYS[d.getDay()], secondary: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}` };
}

export default function SalesBarChart({ data = [], showTotal = false }) {
  if (!data.length) return <div className="chart-empty">No data available</div>;

  const key    = showTotal ? 'total_revenue' : 'order_revenue';
  const values = data.map(d => parseFloat(d[key]) || 0);
  const maxVal = Math.max(...values, 1);
  const yMax   = Math.ceil(maxVal / 200) * 200 || 200;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax].map(v => Math.round(v));

  return (
    <div className="chart-wrap">
      <div className="chart-bars-area">
        {/* Y-axis */}
        <div className="chart-yaxis">
          {[...yTicks].reverse().map((tick, i) => (
            <div key={i} className="chart-yrow">
              <span className="chart-ylabel">₱{tick.toLocaleString()}</span>
              <div className="chart-gridline" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="chart-bars">
          {data.map((d, i) => {
            const val  = parseFloat(d[key]) || 0;
            const pct  = (val / yMax) * 100;
            const { primary, secondary } = formatLabel(d.log_date);

            return (
              <div key={i} className="chart-bar-col">
                <div className="chart-bar-value">
                  {val > 0 ? `₱${Math.round(val).toLocaleString()}` : ''}
                </div>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ height: `${pct}%` }} />
                </div>
                <div className="chart-bar-label">
                  <span className="chart-day">{primary}</span>
                  <span className="chart-date">{secondary}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
