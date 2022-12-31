interface ISubtopicDialogCallback {
  content?: IOrbisPostContent
  streamId?: string
  reload?: boolean
}

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { HiOutlineX as CloseIcon } from 'react-icons/hi'
import { useOrbis } from '../contexts/orbis'
import { useAppData } from '../contexts/appData'
import { getMediaUrl, highlightMentions } from '../utils/orbis'
import { appendToFilename, uploadToIpfs } from '../utils/misc'
import Dialog from './shared/Dialog'
import MentionPopover from './MentionPopover'

const SubtopicDialog = ({
  showDialog,
  setShowDialog,
  subtopic,
  callback
}: {
  showDialog: boolean
  setShowDialog: (showDialog: boolean) => void
  subtopic?: IOrbisPost
  callback?: (options?: ISubtopicDialogCallback) => void
}) => {
  const { orbis, appContext } = useOrbis()
  const { masterId } = useAppData()

  const postBoxArea = useRef<any>(null)

  const [focusOffset, setFocusOffset] = useState<number>(0)
  const [focusNode, setFocusNode] = useState<Node | null>(null)
  const [searchText, setSearchText] = useState('')

  const [formContent, setFormContent] = useState<IOrbisPostContent>({
    body: '',
    title: '',
    media: [],
    mentions: [],
    context: appContext,
    master: masterId,
    reply_to: masterId
  })
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const resetStates = () => {
    setFormContent({
      body: '',
      title: '',
      media: [],
      mentions: [],
      context: appContext,
      master: masterId,
      reply_to: masterId
    })
    setFiles([])
    setIsSubmitting(false)
    setSearchText('')
    setFocusNode(null)
    setFocusOffset(0)
  }

  const isDisabled = useMemo(() => {
    if (!postBoxArea.current) return true
    return formContent.title === '' || formContent.body.length === 0
  }, [formContent])

  const uploadPreviewUrls = useMemo(() => {
    let urls: string[] = []
    if (files) {
      urls = files.map((file) => URL.createObjectURL(file))
    }
    return urls
  }, [files])

  const saveCaretPos = () => {
    const sel = document.getSelection()
    if (sel) {
      setFocusOffset(sel.focusOffset)
      setFocusNode(sel.focusNode)
    }
  }

  const restoreCaretPos = () => {
    if (!postBoxArea.current) return
    postBoxArea.current.focus()
    const sel = document.getSelection()
    if (sel) sel.collapse(focusNode, focusOffset)
  }

  const addMention = (selected: IOrbisProfile) => {
    // Restore cursor position
    restoreCaretPos()

    // Get username of selected profile
    const username = selected?.details?.profile?.username?.trim()

    // Check if username already mentioned
    const hasBeenMentioned = formContent.mentions?.find(
      (o: IOrbisProfile['details']['profile']) => username === o?.username
    )

    // Save selected to mentions
    if (!hasBeenMentioned) {
      const newMentions = []
      if (formContent.mentions && formContent.mentions.length) {
        for (const mention of formContent.mentions) {
          newMentions.push(mention)
        }
      }
      newMentions.push({
        username: '@' + username,
        did: selected.did
      })
      setFormContent({
        ...formContent,
        mentions: newMentions
      })
    }

    // Add mention tag
    const htmlTag =
      '<span href="/profile/' +
      selected.did +
      '" class="text-primary" contenteditable="false" data-did="' +
      selected.did +
      '">@' +
      username +
      '</span><span> </span>'

    for (let i = 0; i < searchText.length + 1; i++) {
      document.execCommand('delete', false, '')
      if (i == searchText.length) {
        document.execCommand('insertHTML', false, htmlTag)
      }
    }

    setTimeout(() => {
      // Clear search text
      setSearchText('')

      // Focus back to postBoxArea
      postBoxArea.current.focus()
      postBoxArea.current.innerHTML.replace(/&nbsp;$/, ' ')

      if (
        typeof window.getSelection != 'undefined' &&
        typeof document.createRange != 'undefined'
      ) {
        const range = document.createRange()
        range.selectNodeContents(postBoxArea.current)
        range.collapse(false)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }, 100)
  }

  const handleDescriptionChange = () => {
    if (!postBoxArea.current) return
    const body = postBoxArea.current.innerText
    setFormContent({
      ...formContent,
      body
    })
    saveCaretPos()
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
  }, [])

  const {
    getRootProps,
    getInputProps,
    open: openFileDialog
  } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'image/*': []
    },
    noClick: true
  })

  const removePreviousMedia = async (index: number) => {
    const newMedia = [
      ...(formContent.media as { url: string; gateway: string }[])
    ]
    newMedia.splice(index, 1)
    setFormContent({ ...formContent, media: newMedia })
  }

  const removeFile = (index: number, url: string) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    if (formContent.media) {
      const cid = url.split('/').pop()
      const ipfsUrl = `ipfs://${cid}`
      // Find media object with ipfs url and remove it from formContent
      const newMedia = formContent.media.filter(
        (media) => media.url !== ipfsUrl
      )
      setFormContent({ ...formContent, media: newMedia })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isSubmitting || isDisabled) return

    setIsSubmitting(true)

    const postContent = { ...formContent }

    if (files.length) {
      const uploadFiles = []
      const newNames = []
      for (const file of files) {
        const stamp = new Date().valueOf()
        const newName = appendToFilename(file.name, `-${appContext}-${stamp}`)
        newNames.push(newName)
        uploadFiles.push(
          new File([file], newName, {
            type: file.type
          })
        )
      }

      const cid = await uploadToIpfs(uploadFiles)

      if (cid) {
        const newMedia = newNames.map((name) => {
          return {
            url: `ipfs://${cid}/${name}`,
            gateway: 'https://nftstorage.link/ipfs/'
          }
        })
        postContent.media = newMedia
      }
    }

    let res
    if (subtopic) {
      // Edit post on Orbis
      res = await orbis.editPost(subtopic.stream_id, postContent)

      if (callback) {
        callback({
          content: postContent,
          reload: true
        })
      }
    } else {
      // Create post on Orbis
      res = await orbis.createPost(postContent)

      if (callback) {
        callback({ streamId: res.doc })
      }
    }

    if (res.status !== 200) {
      alert('Error creating post')
    } else {
      resetStates()
    }

    setIsSubmitting(false)
  }

  useEffect(() => {
    if (!postBoxArea.current) return

    const body = postBoxArea.current.innerText
    if (!body) {
      setSearchText('')
    }

    /**
     * Check characters before caret
     * to determine if user's trying
     * to mention other user
     */
    let _string = ''
    for (let i = focusOffset; i > 0; i--) {
      const lastChar = focusNode?.textContent?.substring(i - 1, i)?.trim()
      _string = lastChar + _string

      // If space found then it's false
      if (!lastChar) {
        setSearchText('')
        return
      }

      // If @ found then it's true
      if (lastChar === '@') {
        setSearchText(_string.replace('@', ''))
        return
      }

      // Default to false
      setSearchText('')
    }
  }, [focusOffset, focusNode])

  useEffect(() => {
    if (subtopic && showDialog) {
      const { content } = subtopic
      setTimeout(() => {
        if (postBoxArea.current)
          postBoxArea.current.innerHTML = highlightMentions(content)
      }, 100)
      setFormContent({
        body: content.body,
        title: content?.title,
        media: content?.media,
        mentions: content?.mentions,
        context: content.context,
        master: masterId,
        reply_to: masterId
      })
      setFiles([])
    } else {
      resetStates()
    }
  }, [subtopic, masterId, showDialog, postBoxArea])

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <form className="w-[735px] max-w-full p-6" onSubmit={handleSubmit}>
        <header className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-large font-title">
            {subtopic ? 'Edit' : 'Add New'} Subtopic
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
              placeholder="Subtopic Title"
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
              <div
                id="postbox"
                ref={postBoxArea}
                className="content-editable min-h-[140px] max-h-[320px]"
                contentEditable={true}
                data-placeholder="Subtopic Content"
                onKeyUp={handleDescriptionChange}
                onPasteCapture={handleDescriptionChange}
                onMouseUp={saveCaretPos}
              />
              {searchText && (
                <MentionPopover
                  searchText={searchText}
                  onSelected={addMention}
                />
              )}
            </div>
          </div>

          {/* Image Dropzone */}
          <div className="mb-4 flex flex-col">
            <label
              className="text-small ml-2 mb-1 text-grey-lighter"
              onClick={openFileDialog}
            >
              Upload New Images
            </label>
            <div
              className="p-6 border border-blue-medium rounded-lg w-full min-h-[142px] flex flex-col items-center justify-center gap-4"
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              {uploadPreviewUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadPreviewUrls.map((imagePreviewUrl, index) => (
                    <div
                      key={index}
                      className="relative w-[200px] aspect-square overflow-hidden"
                    >
                      <img
                        className="w-full h-full object-cover rounded-lg"
                        src={imagePreviewUrl}
                        alt=""
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 btn btn-circle bg-red text-white"
                        onClick={() => removeFile(index, imagePreviewUrl)}
                      >
                        <CloseIcon size="1.25rem" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="btn btn-pill border border-blue-medium text-blue-medium bg-transparent"
                onClick={openFileDialog}
              >
                + Add Images
              </button>
            </div>
          </div>

          {formContent.media && formContent.media.length > 0 && (
            <div className="mb-4 flex flex-col">
              <label
                className="text-small ml-2 mb-1 text-grey-lighter"
                onClick={openFileDialog}
              >
                Previously Uploaded Images
              </label>
              <div className="flex flex-wrap gap-2">
                {formContent.media.map((media, index) => (
                  <div
                    key={index}
                    className="relative w-[200px] aspect-square overflow-hidden"
                  >
                    <img
                      className="w-full h-full object-cover rounded-lg"
                      src={getMediaUrl(media)}
                      alt=""
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 btn btn-circle bg-red text-white"
                      onClick={() => removePreviousMedia(index)}
                    >
                      <CloseIcon size="1rem" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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

export default SubtopicDialog
