import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Maintenance', icon: '◫', end: true },
  { to: '/history', label: 'History', icon: '◎', end: false },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            isActive ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'
          }
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
