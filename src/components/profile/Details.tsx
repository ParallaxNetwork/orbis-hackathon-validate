import { useState, useEffect } from 'react'
import { PassportScorer } from '@gitcoinco/passport-sdk-scorer'
import { useOrbis } from '../../contexts/orbis'
import { getUsername, shortAddress } from '../../utils/orbis'
import Avatar from './Avatar'

const ProfileDetails = ({
  address,
  profile
}: {
  address?: string
  profile: IOrbisProfile
}) => {
  const src = profile?.details?.profile?.pfp
  const { orbis } = useOrbis()

  const [credentials, setCredentials] = useState<IOrbisCredential[]>([])

  const scorer = new PassportScorer([
    {
      provider: 'FirstEthTxnProvider',
      issuer: 'did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC',
      score: 0.5
    },
    {
      provider: 'Twitter',
      issuer: 'did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC',
      score: 0.5
    }
  ])

  const getScore = async () => {
    const score = await scorer.getScore(address as string)
    console.log({ score })
  }

  const getCredentials = async () => {
    const { data, error } = await orbis.getCredentials(profile?.did)
    console.log({ data, error })
    if (!error && data.length) setCredentials(data)
  }

  useEffect(() => {
    if (orbis && profile) {
      getCredentials()
      getScore()
    }
  }, [profile])

  return (
    <div className="px-6 pb-6 mb-6 border-b border-b-muted">
      {/* Columns */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Left */}
        <div className="flex flex-col gap-6 md:w-1/2">
          {/* Pfp, Username, Address */}
          <div className="flex gap-4 items-center">
            <div className="shrink-0">
              <Avatar src={src} defaultSeed={address} size={75} />
            </div>
            <div className="grow">
              <h2 className="font-title text-medium mb-2">
                {getUsername(profile?.details)}
              </h2>
              <div className="flex items-center gap-2">
                <div className="badge bg-grey-dark text-secondary text-small">
                  {shortAddress(address)}
                </div>
              </div>
            </div>
          </div>

          {/* Following, Followers, Topics */}
          <div className="flex gap-4 items-center">
            <p>
              {profile?.count_followers}{' '}
              <span className="text-secondary">Followers</span>
            </p>
            <p>
              {profile?.count_following}{' '}
              <span className="text-secondary">Following</span>
            </p>
            <p>
              15 <span className="text-secondary">Topics</span>
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="md:w-1/2">
          <h2 className="text-grey-lighter mb-2">Credentials</h2>
          <div className="flex flex-wrap items-center gap-2">
            {credentials.map((credential) => (
              <div key={credential.stream_id} className="badge">
                {credential.type}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileDetails
