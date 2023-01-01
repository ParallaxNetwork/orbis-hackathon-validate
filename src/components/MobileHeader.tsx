import { Link } from 'react-router-dom'
import { useOrbis } from '../contexts/orbis'
import { useAppData } from '../contexts/appData'
import ConnectButton from './ConnectButton'

const MobileHeader = () => {
  const { profile } = useOrbis()
  const { setShowTopicDialog } = useAppData()

  return (
    <div className="sticky top-0 flex gap-4 items-center z-10 bg-blue-dark px-4 h-14 border-b border-b-muted md:hidden">
      <Link to="/" className="block select-none">
        <img src="/logo.svg" alt="Validate" className="w-[90px]" />
      </Link>
      {profile ? (
        <div className="ml-auto">
          <button
            className="btn btn-pill bg-primary"
            onClick={() => setShowTopicDialog(true)}
          >
            + New Topic
          </button>
        </div>
      ) : (
        <div className="ml-auto">
          <ConnectButton withMessage={false} />
        </div>
      )}
    </div>
  )
}

export default MobileHeader
