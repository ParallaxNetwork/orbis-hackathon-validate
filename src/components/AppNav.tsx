import { Link, NavLink } from 'react-router-dom'
import { useOrbis } from '../contexts/orbis'
import { useAppData } from '../contexts/appData'

const AppNav = () => {
  const { profile } = useOrbis()
  const { setShowTopicDialog } = useAppData()

  return (
    <div className="sticky top-0 py-6 md:min-w-[195px]">
      <Link
        to="/"
        className="inline-block font-body font-bold text-2xlarge mb-8 px-6 select-none"
      >
        <img src="/logo.svg" alt="Validate" className="w-[136px]" />
      </Link>
      {profile && (
        <div className="mb-6 px-6">
          <button
            className="btn btn-pill bg-primary large"
            onClick={() => setShowTopicDialog(true)}
          >
            + New Topic
          </button>
        </div>
      )}
      <nav className="nav">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? 'nav-item active' : 'nav-item'
          }
        >
          Explore
        </NavLink>
        <NavLink
          to="/favourites"
          className={({ isActive }) =>
            isActive ? 'nav-item active' : 'nav-item'
          }
        >
          Favourites
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? 'nav-item active' : 'nav-item'
          }
        >
          Profile
        </NavLink>
      </nav>
    </div>
  )
}

export default AppNav
