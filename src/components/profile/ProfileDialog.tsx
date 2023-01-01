import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useOrbis } from '../../contexts/orbis'
import { didToAddress } from '../../utils/orbis'
import { HiOutlineX as CloseIcon } from 'react-icons/hi'
import { appendToFilename, uploadSingleFileToIpfs } from '../../utils/misc'
import Dialog from '../shared/Dialog'
import Avatar from './Avatar'
import Nfts from './Nfts'

const DefaultFormData = {
  pfp: '',
  cover: '',
  data: {},
  username: '',
  description: ''
}

const ProfileDialog = ({
  showDialog,
  setShowDialog
}: {
  showDialog: boolean
  setShowDialog: (showDialog: boolean) => void
}) => {
  const { orbis, appContext, profile, setProfile } = useOrbis()

  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [openNfts, setOpenNfts] = useState<boolean>(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] =
    useState<IOrbisProfile['details']['profile']>(DefaultFormData)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const _file = acceptedFiles[0]
    setPreviewUrl(URL.createObjectURL(_file))
    setFile(_file)
  }, [])

  const { getInputProps, open: openFileDialog } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': []
    },
    noClick: true
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!profile) return

    setIsUpdating(true)

    const _formData = { ...formData }

    if (file) {
      // Upload file to IPFS
      try {
        const stamp = new Date().valueOf()
        const newName = appendToFilename(file.name, `-${appContext}-${stamp}`)
        const uploadFile = new File([file], newName, {
          type: file.type
        })

        const cid = await uploadSingleFileToIpfs(uploadFile)

        if (cid) {
          const pfpUrl = `https://nftstorage.link/ipfs/${cid}`
          _formData.pfp = pfpUrl
          delete _formData.pfpIsNft
        }
      } catch (error) {
        console.log('error', error)
      }
    }

    const res = await orbis.updateProfile(_formData)

    setIsUpdating(false)

    if (res.status === 200) {
      setProfile({
        ...profile,
        details: { ...profile?.details, profile: _formData }
      })
      setShowDialog(false)
    }
  }

  useEffect(() => {
    if (!showDialog) {
      setOpenNfts(false)
      setFile(null)
      setPreviewUrl(null)
    }
    if (profile) setFormData(profile.details.profile)
  }, [showDialog, profile])

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <form className="w-[512px] max-w-full p-6" onSubmit={handleSubmit}>
        <header className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-large font-title">Edit Profile</h2>
          <button
            type="button"
            className="btn btn-circle bg-blue-medium"
            onClick={() => setShowDialog(false)}
          >
            <CloseIcon size="1.25rem" />
          </button>
        </header>

        <div className="mb-4">
          {/* Avatar */}
          <div className="mb-4 flex flex-col">
            <label
              htmlFor="avatar"
              className="text-small ml-2 mb-1 text-grey-lighter"
            >
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <Avatar
                src={previewUrl || formData?.pfp}
                size={75}
                defaultSeed={didToAddress(profile?.did)}
              />
              <div className="flex items-center gap-2">
                <input {...getInputProps()} />
                <button
                  type="button"
                  className="btn btn-pill bg-blue-lightest"
                  onClick={openFileDialog}
                >
                  Upload
                </button>
                <button
                  type="button"
                  className="btn btn-pill bg-blue-lightest"
                  onClick={() => setOpenNfts(!openNfts)}
                >
                  Use an NFT
                </button>
              </div>
            </div>

            {openNfts && (
              <div className="mt-4">
                <Nfts
                  address={didToAddress(profile?.did)}
                  onSelect={(nft) => {
                    setFormData({
                      ...formData,
                      pfp: nft.media[0]?.gateway || nft.media[0]?.raw,
                      pfpIsNft: {
                        chain: 'ethereum',
                        contract: nft.contract.address,
                        tokenId: nft.tokenId,
                        timestamp: Math.floor(Date.now() / 1000).toString()
                      }
                    })
                    setOpenNfts(false)
                  }}
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="mb-4 flex flex-col">
            <label
              htmlFor="title"
              className="text-small ml-2 mb-1 text-grey-lighter"
            >
              Username <span className="text-red">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData?.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required={true}
              maxLength={140}
            />
          </div>

          {/* Description */}
          <div className="mb-4 flex flex-col">
            <label
              htmlFor="content"
              className="text-small ml-2 mb-1 text-grey-lighter"
            >
              Description <span className="text-red">*</span>
            </label>
            <textarea
              id="content"
              defaultValue={formData?.description}
              rows={4}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value })
              }}
              required={true}
            />
          </div>
        </div>

        <footer className="flex justify-end">
          <button
            type="submit"
            className="btn btn-pill bg-primary"
            disabled={!formData?.username || isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        </footer>
      </form>
    </Dialog>
  )
}

export default ProfileDialog
