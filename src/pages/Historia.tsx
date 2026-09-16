import { timelineEvents } from '../lib/mockData'
import './Historia.css'

export function Historia() {
  return (
    <div className="historia-page">
      <div className="historia-inner">
        <div className="historia-header">
          <h1 className="historia-title">Nuestra historia</h1>
          <p className="historia-sub">Así hemos construido nuestra senda.</p>
        </div>

        <div className="timeline">
          {timelineEvents.map((event, i) => (
            <div key={i} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
              <div className="timeline-card">
                <div className="timeline-photo" style={{ backgroundImage: `url(${event.photo})` }}>
                  <div className="timeline-photo-overlay" />
                </div>
                <div className="timeline-body">
                  <span className="timeline-date">{event.date}</span>
                  <h3 className="timeline-event-title">{event.title}</h3>
                  <p className="timeline-place">{event.place}</p>
                  <p className="timeline-desc">{event.description}</p>
                </div>
              </div>
              <div className="timeline-node">
                <span className="timeline-icon">{event.icon}</span>
              </div>
              <div className="timeline-space" />
            </div>
          ))}

          <div className="timeline-end">
            <div className="timeline-end-node">
              <span>✦</span>
            </div>
            <p className="timeline-end-text">y esto es solo el comienzo…</p>
          </div>
        </div>
      </div>
    </div>
  )
}
