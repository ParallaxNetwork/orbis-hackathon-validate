import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAccount, useSigner } from 'wagmi'
import { useOrbis } from '../contexts/orbis'
import { AppDataProvider } from '../contexts/appData'
import AppNav from '../components/AppNav'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import MobileNav from '../components/MobileNav'

const Main = () => {
  const { isConnected } = useAccount()
  const { data: signer } = useSigner()
  const { checkOrbisConnection } = useOrbis()

  useEffect(() => {
    if (isConnected && signer) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      checkOrbisConnection({ provider: signer?.provider?.provider })
    }
  }, [isConnected, signer])

  return (
    <AppDataProvider>
      <div className="container flex flex-wrap md:flex-nowrap min-h-screen md:divide-x md:divide-muted">
        <header className="hidden shrink-0 md:block">
          <AppNav />
        </header>
        <main className="grow">
          <MobileHeader />
          <div className="pb-16 md:pt-0">
            <Outlet />
          </div>
          <MobileNav />
        </main>
        <aside className="shrink-0 hidden xl:block xl:min-w-[375px]">
          <Sidebar />
        </aside>
      </div>
    </AppDataProvider>
  )
}

export default Main
