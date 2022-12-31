import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useOrbis } from '../contexts/orbis'
import { MdImage as ImageIcon, MdPoll as VoteIcon } from 'react-icons/md'
import { HiOutlineX as CloseIcon } from 'react-icons/hi'
import { didToAddress, getUsername } from '../utils/orbis'
import { appendToFilename, uploadToIpfs } from '../utils/misc'
import MentionPopover from './MentionPopover'
import ElectionDialog from './ElectionDialog'
import { Election } from '@vocdoni/sdk'
import Avatar from './profile/Avatar'

interface ISubtopicDialogCallback {
  post?: IOrbisPost
  content?: IOrbisPostContent
  streamId?: string
  reload?: boolean
}

const CommentBox = ({
  subtopic,
  placeholder = 'Share your thoughts...',
  replyTo,
  editPost,
  callback
}: {
  subtopic: IOrbisPost
  placeholder?: string
  replyTo?: IOrbisPost | null
  editPost?: IOrbisPost
  callback?: (options?: ISubtopicDialogCallback) => void
}) => {
  const { orbis, appContext, profile } = useOrbis()
  const commentBox = useRef<any>()

  const [mentions, setMentions] = useState<IOrbisPostMention[]>([])

  const [files, setFiles] = useState<File[]>([])
  const [focusOffset, setFocusOffset] = useState<number>(0)
  const [focusNode, setFocusNode] = useState<Node | null>(null)
  const [searchText, setSearchText] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showElectionDialog, setShowElectionDialog] = useState<boolean>(false)

  const resetStates = () => {
    setMentions([])
    setFiles([])
    setSearchText('')
    setIsSubmitting(false)
    commentBox.current.innerHTML = ''
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Compare each accepted file with existing files
      const newFiles = acceptedFiles.filter((file) => {
        const existingFile = files.find((f) => f.name === file.name)
        if (existingFile) return false
        return true
      })

      console.log(newFiles)

      // Add new files to existing files
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
    },
    [files]
  )

  const { getInputProps, open: openFileDialog } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'image/*': []
    },
    noClick: true
  })

  const isDisabled = useMemo(() => {
    if (!commentBox.current) return true
    const text = commentBox.current?.innerText
    console.log(text.length)
    return text.length === 0
  }, [commentBox.current?.innerText])

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
    if (!commentBox.current) return
    commentBox.current.focus()
    const sel = document.getSelection()
    if (sel) sel.collapse(focusNode, focusOffset)
  }

  const addMention = (selected: IOrbisProfile) => {
    // Restore cursor position
    restoreCaretPos()

    // Get username of selected profile
    const username = selected?.details?.profile?.username?.trim()

    // Check if username already mentioned
    const hasBeenMentioned = mentions?.find(
      (o: IOrbisProfile['details']['profile']) => username === o?.username
    )

    // Save selected to mentions
    if (!hasBeenMentioned) {
      const newMentions = []
      if (mentions && mentions.length) {
        for (const mention of mentions) {
          newMentions.push(mention)
        }
      }
      newMentions.push({
        username: '@' + username,
        did: selected.did
      })
      setMentions(newMentions)
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

      // Focus back to commentBox
      commentBox.current.focus()
      commentBox.current.innerHTML.replace(/&nbsp;$/, ' ')

      if (
        typeof window.getSelection != 'undefined' &&
        typeof document.createRange != 'undefined'
      ) {
        const range = document.createRange()
        range.selectNodeContents(commentBox.current)
        range.collapse(false)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }, 100)
  }

  const handleChange = () => {
    if (!commentBox.current) return
    saveCaretPos()
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  const onElectionCreated = async (election: Election) => {
    console.log(election)
  }

  const handleSubmit = async () => {
    if (isSubmitting || isDisabled || !orbis || !profile) return

    setIsSubmitting(true)

    const postContent: IOrbisPostContent = {
      body: commentBox.current.innerText,
      context: appContext,
      mentions: mentions,
      master: subtopic.stream_id,
      reply_to: replyTo ? replyTo.stream_id : subtopic.stream_id
    }

    const timestamp = Math.floor(Date.now() / 1000)

    if (files.length) {
      const uploadFiles = []
      const newNames = []
      for (const file of files) {
        const newName = appendToFilename(
          file.name,
          `-${appContext}-${timestamp}`
        )
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
    if (editPost) {
      // Edit post on Orbis
      res = await orbis.editPost(editPost.stream_id, postContent)

      if (callback) {
        callback({
          content: postContent,
          reload: true
        })
      }
    } else {
      const _placeholderPost = {
        content: postContent,
        context: appContext,
        creator: profile.did,
        creator_details: { ...profile.details },
        stream_id: 'new_post-' + timestamp,
        timestamp,
        master: subtopic.stream_id,
        reply_to: replyTo ? replyTo.stream_id : subtopic.stream_id,
        reply_to_creator_details: replyTo
          ? replyTo.creator_details
          : subtopic.creator_details,
        reply_to_details: replyTo ? replyTo.content : subtopic.content,
        count_commits: 1,
        count_likes: 0,
        count_haha: 0,
        count_downvotes: 0,
        count_replies: 0,
        type: 'reply'
      }

      if (callback) {
        callback({ post: _placeholderPost as IOrbisPost })
      }

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
    if (!commentBox.current) return

    const body = commentBox.current.innerText
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

  return (
    <>
      <div className="flex flex-col gap-4">
        {replyTo && (
          <div className="flex items-center gap-2 overflow-x-hidden">
            <span className="shrink-0 text-small text-secondary">
              Replying to:
            </span>
            <div className="shrink-0">
              <Avatar
                size={24}
                src={replyTo.creator_details?.profile?.pfp}
                defaultSeed={didToAddress(replyTo.creator_details.did)}
              />
            </div>
            <div className="grow truncate">
              <span className="font-title text-small">
                {getUsername(replyTo.creator_details)}
              </span>
            </div>
          </div>
        )}
        <div className="relative">
          <div
            id="postbox"
            ref={commentBox}
            className="content-editable min-h-[140px] max-h-[320px] transition-all duration-300 empty:min-h-[46px] empty:focus:min-h-[140px]"
            contentEditable={true}
            data-placeholder={placeholder}
            onKeyUp={handleChange}
            onMouseUp={saveCaretPos}
          />
          {searchText && (
            <MentionPopover searchText={searchText} onSelected={addMention} />
          )}
        </div>
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
                  onClick={() => removeFile(index)}
                >
                  <CloseIcon size="1.25rem" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-blue-medium"
              onClick={openFileDialog}
            >
              <ImageIcon size="1.5rem" />
            </button>
            {!replyTo && (
              <button
                type="button"
                className="text-blue-medium"
                onClick={() => setShowElectionDialog(true)}
              >
                <VoteIcon size="1.5rem" />
              </button>
            )}
          </div>
          <button
            type="button"
            className="btn btn-pill bg-primary"
            onClick={handleSubmit}
            disabled={isDisabled || isSubmitting}
          >
            Submit
          </button>
        </div>
      </div>
      <ElectionDialog
        subtopic={subtopic}
        showDialog={showElectionDialog}
        setShowDialog={setShowElectionDialog}
        onCreated={onElectionCreated}
      />
    </>
  )
}

export default CommentBox
