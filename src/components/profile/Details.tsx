import { useState, useEffect } from 'react'
import { useOrbis } from '../../contexts/orbis'
import { useTopicsCount } from '../../hooks/useTopic'
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
  const { count: topicsCount } = useTopicsCount(profile?.did)

  const [isFollowing, setIsFollowing] = useState<boolean>(false)
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false)
  const [credsFamilies, setCredsFamilies] = useState<
    Record<string, IOrbisCredential[]>
  >({})

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

      setCredsFamilies(grouped)
    }
  }

  const getIsFollowing = async () => {
    if (!orbis || !profile || !loggedProfile) return
    const { data, error } = await orbis.getIsFollowing(
      loggedProfile.did,
      profile?.did
    )
    if (error) {
      console.error(error)
      setIsFollowing(false)
    }
    if (data) {
      setIsFollowing(data)
    }
  }

  const setFollow = async () => {
    if (!orbis || !profile || !loggedProfile) return
    const res = await orbis.setFollow(
      profile.did,
      !isFollowing
    )
    if (res.status === 200) {
      setIsFollowing(!isFollowing)
    }
  }

  useEffect(() => {
    if (orbis && profile) {
      getCredentials()

      if (loggedProfile) {
        getIsFollowing()
      }
    }
  }, [orbis, profile, loggedProfile])

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
                {loggedProfile && profile && (
                  <>
                    {loggedProfile.did === profile?.did ? (
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
                    ) : (
                      <button
                        className="btn btn-pill border-2 border-primary data-[following=true]:text-blue-dark data-[following=true]:bg-primary data-[following=false]:text-primary data-[following=false]:bg-transparent"
                        data-following={isFollowing}
                        onClick={() => setFollow()}
                      >
                        {!isFollowing ? 'Follow' : 'Following'}
                      </button>
                    )}
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
              {topicsCount} <span className="text-secondary">Topics</span>
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="md:w-1/2">
          <h2 className="text-grey-lighter mb-2">Verifiable Credentials</h2>
          <div className="flex flex-wrap items-center gap-2">
            {credsFamilies &&
              credsFamilies['gitcoin'] &&
              credsFamilies['gitcoin'].map((cred, index) => {
                if (index >= 7) return ''
                return (
                  <div
                    key={cred.stream_id}
                    className="badge badge-pill small bg-blue-medium text-small"
                  >
                    {cred.provider}
                  </div>
                )
              })}

            {credsFamilies &&
              credsFamilies['gitcoin'] &&
              credsFamilies['gitcoin'].length > 7 && (
              <div className="badge badge-pill small bg-blue-medium text-small">
                +{credsFamilies['gitcoin'].length - 7}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileDetails
