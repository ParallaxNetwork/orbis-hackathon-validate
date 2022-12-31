import { useState, useEffect } from 'react'
import { PassportScorer } from '@gitcoinco/passport-sdk-scorer'
import { useOrbis } from '../../contexts/orbis'
import {
  filterExpiredCredentials,
  getUsername,
  shortAddress
} from '../../utils/orbis'
import Avatar from './Avatar'
import ProfileDialog from './ProfileDialog'

const ProfileDetails = ({
  address,
  profile
}: {
  address?: string
  profile: IOrbisProfile
}) => {
  const src = profile?.details?.profile?.pfp
  const { orbis, profile: loggedProfile } = useOrbis()

  const [showEditDialog, setShowEditDialog] = useState<boolean>(false)
  const [credsFamilies, setCredsFamilies] = useState<
    Record<string, IOrbisCredential[]>
  >({})

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
    if (error) console.error(error)
    if (data) {
      const filtered = filterExpiredCredentials(data)
      // Group filtered credentials by family
      const grouped = filtered.reduce((acc, curr) => {
        let { family } = curr
        // If family is null set as Gitcoin
        if (!family) {
          family = 'gitcoin'
        }
        if (acc[family]) {
          acc[family].push(curr)
        } else {
          acc[family] = [curr]
        }
        return acc
      }, {} as { [key: string]: IOrbisCredential[] })

      console.log(grouped)

      setCredsFamilies(grouped)

      console.log(
        'Gitcoin:',
        grouped['gitcoin'].map((cred) => {
          return cred.content.credentialSubject?.provider
        })
      )

      console.log(
        'Krebit:',
        grouped['krebit'].map((cred) => {
          return cred.content.credentialSubject?.type
        })
      )
    }
  }

  useEffect(() => {
    if (orbis && profile) {
      getCredentials()
      getScore()
    }
  }, [profile])

  return (
    <div className="p-6 border-b border-b-muted">
      {/* Columns */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Left */}
        <div className="flex flex-col gap-6 md:w-1/2">
          {/* Pfp, Username, Address */}
          <div className="flex gap-4 items-center">
            <div className="shrink-0">
              <Avatar
                src={src}
                defaultSeed={address?.toLowerCase()}
                size={75}
              />
            </div>
            <div className="grow">
              <h2 className="font-title text-medium mb-2">
                {getUsername(profile?.details)}
              </h2>
              <div className="flex items-center gap-2">
                <div className="badge badge-pill bg-grey-dark text-secondary text-small">
                  {shortAddress(address)}
                </div>
                {loggedProfile && loggedProfile.did === profile?.did && (
                  <>
                    <button
                      className="btn btn-pill bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-blue-dark"
                      onClick={() => setShowEditDialog(true)}
                    >
                      Edit Profile
                    </button>
                    <ProfileDialog
                      showDialog={showEditDialog}
                      setShowDialog={setShowEditDialog}
                    />
                  </>
                )}
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
            {/* {Object.keys(credsFamilies).map((family) => {
              const credentials = credsFamilies[family]
              credentials.map((credential) => {
                const { type } = credential
                return (
                  <div key={credential.stream_id} className="badge">
                    {type}
                  </div>
                )
              })
            })} */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileDetails
