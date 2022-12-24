import { useOrbis } from '../contexts/orbis'
import ConnectButton from './ConnectButton'
import Trending from './shared/Trending'

const Sidebar = () => {
  const { profile } = useOrbis()

  return (
    <>
      {!profile && (
        <div className="my-6 px-6 pb-6 border-b border-b-muted">
          <ConnectButton />
        </div>
      )}
      <Trending />
    </>
  )
}

export default Sidebar
