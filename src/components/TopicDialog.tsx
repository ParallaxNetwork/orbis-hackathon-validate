import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { HiOutlineX as CloseIcon } from 'react-icons/hi'
import { useOrbis } from '../contexts/orbis'
import { getMediaUrl } from '../utils/orbis'
import { sleep, appendToFilename, uploadSingleFileToIpfs } from '../utils/misc'
import Dialog from './shared/Dialog'

const TopicDialog = ({
  showDialog,
  setShowDialog,
  topic
}: {
  showDialog: boolean
  setShowDialog: (showDialog: boolean) => void
  topic?: IOrbisPost
}) => {
  const { orbis, appContext } = useOrbis()
  const navigate = useNavigate()

  const [formContent, setFormContent] = useState<IOrbisPostContent>({
    body: '',
    title: '',
    media: [],
    context: appContext
  })
  const [file, setFile] = useState<File | null>()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const isDisabled = useMemo(() => {
    return (
      formContent.title === '' ||
      formContent.body.length === 0 ||
      formContent.body.length > 280
    )
  }, [formContent])

  const imagePreviewUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file)
    } else if (formContent.media?.length) {
      const url = getMediaUrl(formContent.media[0])
      return url
    }
    return null
  }, [file, formContent.media])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target
    setFormContent({ ...formContent, body: value })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const _file = acceptedFiles[0]
    setFile(_file)
  }, [])

  const {
    getRootProps,
    getInputProps,
    open: openFileDialog
  } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': []
    },
    noClick: true
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isSubmitting || isDisabled) return

    setIsSubmitting(true)

    const postContent = { ...formContent }

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
          postContent.media = [
            {
              url: `ipfs://${cid}/${newName}`,
              gateway: 'https://nftstorage.link/ipfs/'
            }
          ]
        }
      } catch (error) {
        console.log('error', error)
      }
    }

    let res
    if (topic) {
      // Edit post on Orbis
      res = await orbis.editPost(topic.stream_id, postContent)
    } else {
      // Create post on Orbis
      res = await orbis.createPost(postContent)
    }

    console.log(res)
    if (res.status !== 200) {
      alert('Error creating post')
    } else {
      await sleep(2000)

      setFormContent({
        body: '',
        title: '',
        media: [],
        context: appContext
      })
      setFile(null)
      setShowDialog(false)

      // Navigate to newly created topic
      navigate(`/topic/${res.doc}`)
    }

    setIsSubmitting(false)
  }

  useEffect(() => {
    if (topic) {
      console.log('fill topic data')
      const { content: topicContent } = topic
      setFormContent({
        body: topicContent.body,
        title: topicContent?.title,
        media: topicContent?.media,
        context: topicContent.context
      })
      setFile(null)
    } else {
      setFormContent({
        body: '',
        title: '',
        media: [],
        context: appContext
      })
      setFile(null)
    }
  }, [topic])

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <form className="w-[735px] max-w-full p-6" onSubmit={handleSubmit}>
        <header className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-large font-title">
            {topic ? 'Edit' : 'Add New'} Topic
          </h2>
          <button
            type="button"
            className="btn btn-circle bg-blue-medium"
            onClick={() => setShowDialog(false)}
          >
            <CloseIcon size="1.25rem" />
          </button>
        </header>

        <div className="mb-4">
          {/* Title */}
          <div className="mb-4 flex flex-col">
            <label
              htmlFor="title"
              className="text-small ml-2 mb-1 text-grey-lighter"
            >
              Title <span className="text-red">*</span>
            </label>
            <input
              id="title"
              type="text"
              defaultValue={formContent.title as string}
              onChange={(e) =>
                setFormContent({ ...formContent, title: e.target.value })
              }
              required={true}
              maxLength={140}
            />
          </div>

          {/* Content */}
          <div className="mb-4 flex flex-col">
            <label
              htmlFor="content"
              className="text-small ml-2 mb-1 text-grey-lighter"
            >
              Content <span className="text-red">*</span>
            </label>
            <div className="relative">
              <textarea
                id="content"
                defaultValue={formContent.body}
                rows={4}
                onChange={handleContentChange}
                required={true}
              />
              <div
                className={`absolute bottom-2 right-2 text-small ${
                  formContent.body.length < 280
                    ? 'text-grey-lighter'
                    : 'text-red'
                }`}
              >
                {formContent.body.length}/280
              </div>
            </div>
          </div>

          {/* Image Dropzone */}
          <div className="mb-4 flex flex-col">
            <label
              className="text-small ml-2 mb-1 text-grey-lighter"
              onClick={openFileDialog}
            >
              Image
            </label>
            <div
              className="p-6 border border-blue-medium rounded-lg w-full min-h-[142px] flex flex-col items-center justify-center gap-4"
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              {imagePreviewUrl ? (
                <>
                  <div className="w-[250px] aspect-square overflow-hidden">
                    <img
                      className="w-full h-full object-cover rounded-lg"
                      src={imagePreviewUrl}
                      alt="Preview"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-pill border border-blue-medium text-blue-medium bg-transparent"
                    onClick={() => {
                      setFile(null)
                      setFormContent({ ...formContent, media: [] })
                    }}
                  >
                    Remove Image
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-pill border border-blue-medium text-blue-medium bg-transparent"
                  onClick={openFileDialog}
                >
                  + Add Image
                </button>
              )}
            </div>
          </div>
        </div>

        <footer className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary btn-pill"
            disabled={isDisabled || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </footer>
      </form>
    </Dialog>
  )
}

export default TopicDialog
