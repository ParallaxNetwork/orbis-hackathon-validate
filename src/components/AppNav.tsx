import { NavLink } from 'react-router-dom'

const AppNav = () => {
  const handleClick: () => void = () => {
    console.log('Clicked!')
  }

  return (
    <div className="my-6 md:min-w-[195px]">
      <div className="font-body font-bold text-xlarge mb-8 px-6">
        <span className="text-primary">V</span>alidate
      </div>
      <div className="mb-6 px-6">
        <button className="btn btn-primary btn-large" onClick={handleClick}>
          + New Topic
        </button>
      </div>
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
