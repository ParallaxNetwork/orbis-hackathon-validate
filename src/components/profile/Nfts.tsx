import { useState, useEffect } from 'react'
import { Nft } from 'alchemy-sdk'
import { alchemy } from '../../utils/alchemy'
import Loading from '../Loading'

const Nfts = ({
  address,
  onSelect
}: {
  address: string
  onSelect: (nft: Nft) => void
}) => {
  const [nfts, setNfts] = useState<Nft[]>([])
  const [pageKey, setPageKey] = useState<string>()
  const [isFetching, setIsFetching] = useState<boolean>(false)

  const fetchNfts = async (reset = false) => {
    if (isFetching) return false

    setIsFetching(true)

    const res = await alchemy.nft.getNftsForOwner(address, {
      pageKey: reset ? undefined : pageKey
    })

    setPageKey(res.pageKey)

    const _nfts = reset ? res.ownedNfts : [...nfts, ...res.ownedNfts]
    setNfts(_nfts)

    setIsFetching(false)
  }

  const reloadNft = async (index: number) => {
    const nft = nfts[index]
    const res = await alchemy.nft.getNftMetadata(
      nft.contract.address,
      nft.tokenId,
      nft.contract.tokenType
    )

    // Update nft at index
    const _nfts = [...nfts]
    _nfts[index] = res
    setNfts(_nfts)
  }

  useEffect(() => {
    if (address) fetchNfts()
  }, [address])

  return (
    <div className="p-4 border border-dashed border-muted rounded-lg max-h-[320px] overflow-x-hidden overflow-y-auto">
      <div className="grid grid-cols-3 gap-2">
        {nfts.map((nft, index) => (
          <div
            key={index}
            className="w-full aspect-square rounded-lg overflow-hidden"
          >
            {nft.media.length < 1 ? (
              <button
                type="button"
                className="btn btn-pill small bg-blue-lightest"
                onClick={() => reloadNft(index)}
              >
                Reload
              </button>
            ) : (
              <button
                type="button"
                className="relative w-full h-full disabled:grayscale"
                onClick={() => onSelect(nft)}
              >
                <img
                  src={
                    nft?.media[0]?.thumbnail ||
                    nft?.media[0]?.gateway ||
                    nft?.media[0]?.raw
                  }
                  className="w-full h-full object-center object-cover"
                  alt={`${nft.contract.name} - ${nft.title}`}
                />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        {!isFetching && nfts.length > 0 && pageKey && (
          <button
            type="button"
            className="btn btn-pill bg-blue-lightest mt-6"
            onClick={() => fetchNfts(false)}
          >
            Load More
          </button>
        )}
        
        {isFetching && (
          <div className="flex items-center justify-center">
            <Loading />
          </div>
        )}
      </div>
    </div>
  )
}

export default Nfts
