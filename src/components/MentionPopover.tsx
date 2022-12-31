import { useState, useEffect } from 'react'
import { useOrbis } from '../contexts/orbis'
import { didToAddress, getUsername } from '../utils/orbis'
import { debounce } from '../utils/misc'

import Avatar from './profile/Avatar'
import Loading from './Loading'

const MentionPopover = ({
  searchText,
  onSelected
}: {
  searchText: string
  onSelected: (profile: IOrbisProfile) => void
}) => {
  const { orbis } = useOrbis()

  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<IOrbisProfile[]>([])

  const searchProfiles = debounce(async () => {
    setIsSearching(true)
    setSearchResults([])
    const { data, error } = await orbis.getProfilesByUsername(searchText)
    if (data) {
      setSearchResults(data)
    } else {
      console.log(error)
    }
    setIsSearching(false)
  }, 1000)

  useEffect(() => {
    if (searchText) {
      searchProfiles()
    } else {
      setIsSearching(false)
      setSearchResults([])
    }
  }, [searchText])

  return (
    <div className="absolute top-full left-0 right-0 rounded-b-lg overflow-hidden z-10 bg-white">
      {isSearching ? (
        <div className="flex items-center justify-center p-4 text-blue-dark">
          <Loading />
        </div>
      ) : (
        <div className="max-h-[320px] overflow-y-auto">
          {searchResults.length > 0 ? (
            <>
              {searchResults.map((profile) => (
                <div
                  key={profile.did}
                  className="flex items-center justify-between p-4 border-b border-b-muted bg-white text-blue-dark cursor-pointer hover:bg-primary"
                  onClick={() => onSelected(profile)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      size={24}
                      src={profile.details?.profile?.pfp}
                      defaultSeed={didToAddress(profile.did)}
                    />
                    <p className="text-sm font-semibold">
                      {getUsername(profile.details)}
                    </p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex items-center justify-center p-4">
              <p className="text-muted">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MentionPopover
