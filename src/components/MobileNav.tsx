import { NavLink } from 'react-router-dom'
import {
  MdOutlineExplore as ExploreIcon,
  MdOutlineBookmarkBorder as FavouriteIcon,
  MdOutlineAccountCircle as ProfileIcon
} from 'react-icons/md'

const MobileNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-dark h-16 z-30 border-t border-t-muted flex items-center justify-around gap-6 md:hidden">
      <NavLink
        to="/favourites"
        className={({ isActive }) =>
          isActive ? 'nav-item active' : 'nav-item'
        }
      >
        <FavouriteIcon size="1.5rem" />
      </NavLink>
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? 'nav-item active' : 'nav-item'
        }
      >
        <ExploreIcon size="1.5rem" />
      </NavLink>
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          isActive ? 'nav-item active' : 'nav-item'
        }
      >
        <ProfileIcon size="1.5rem" />
      </NavLink>
    </div>
  )
}

export default MobileNav
