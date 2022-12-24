import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'

import { useOrbis } from '../contexts/orbis'

import ConnectButton from '../components/ConnectButton'
import ProfileDetails from '../components/profile/Details'
import Loading from '../components/Loading'

const Profile = () => {
  const { address } = useParams()
  const { address: accountAddress } = useAccount()
  const { orbis, profile, getDid } = useOrbis()

  const [initialized, setInitialized] = useState(false)
  const [pageProfile, setPageProfile] = useState<IOrbisProfile | null>(null)

  useEffect(() => {
    const getProfile: () => Promise<void> = async () => {
      const _did = await getDid(address)

      if (_did) {
        const { data, error } = await orbis.getProfile(_did)

        if (!error && data) {
          setPageProfile(data)
        }
      }

      setInitialized(true)
    }

    if (address) {
      getProfile()
    } else {
      setPageProfile(profile)
      setInitialized(true)
    }
  }, [orbis, address, profile])

  if (!initialized) {
    return <Loading />
  }

  if (!pageProfile) {
    return (
      <div className="flex flex-col items-center justify-center my-12">
        <ConnectButton />
      </div>
    )
  }

  return (
    <>
      <ProfileDetails
        address={address || accountAddress}
        profile={pageProfile}
      />
    </>
  )
}

export default Profile
