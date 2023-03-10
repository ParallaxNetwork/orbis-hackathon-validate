import { useEffect, useState } from 'react'
import { useOrbis } from '../contexts/orbis'
import {
  HiArrowSmUp as UpvoteIcon,
  HiArrowSmDown as DownvoteIcon,
  HiDotsVertical as EllipsisIcon,
  HiPencil as EditIcon,
  HiTrash as DeleteIcon
} from 'react-icons/hi'
import { BsFillReplyFill as ReplyIcon } from 'react-icons/bs'
import {
  didToAddress,
  getUsername,
  formatMessage,
  formatDate
} from '../utils/orbis'
import Avatar from './profile/Avatar'
import Popover from './shared/Popover'
import AlertDialog from './shared/AlertDialog'
import Election from './Election'

const Comment = ({
  comment,
  subtopic,
  onReply,
  onDeleted,
  onEdit
}: {
  comment: IOrbisPost
  subtopic: IOrbisPost
  onReply: (comment: IOrbisPost) => void
  onDeleted: (commentId: string) => void
  onEdit: (comment: IOrbisPost) => void
}) => {
  const { orbis, profile } = useOrbis()
  const {
    creator,
    creator_details,
    reply_to,
    reply_to_creator_details,
    reply_to_details,
    count_likes,
    count_downvotes
  } = comment

  const [reacted, setReacted] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false)
  const [openOptions, setOpenOptions] = useState<boolean>(false)
  const [upvotes, setUpvotes] = useState<number>(count_likes)
  const [downvotes, setDownvotes] = useState<number>(count_downvotes)

  const reacting = async (type: string) => {
    if (!profile || !orbis || reacted === type || !comment) return
    
    setReacted(type)

    if (type === 'like') {
      setUpvotes(upvotes + 1)
      if (reacted === 'downvote') {
        setDownvotes(downvotes - 1)
      }
    } else if (type === 'downvote') {
      setDownvotes(downvotes + 1)
      if (reacted === 'like') {
        setUpvotes(upvotes - 1)
      }
    }
    
    const res = await orbis.react(comment.stream_id, type)
    // Revert back if failed
    if (res.status !== 200) {
      setReacted(reacted)
      if (type === 'like') {
        setUpvotes(upvotes - 1)
        if (reacted === 'downvote') {
          setDownvotes(downvotes + 1)
        }
      } else if (type === 'downvote') {
        setDownvotes(downvotes - 1)
        if (reacted === 'like') {
          setUpvotes(upvotes + 1)
        }
      }
    }
  }

  const getReacted = async () => {
    if (!orbis || !profile) return
    const { data, error } = await orbis.getReaction(
      comment.stream_id,
      profile.did
    )

    if (!error && data) {
      setReacted(data.type)
    }
  }

  const handleDelete: () => Promise<void> = async () => {
    setIsDeleting(true)
    const res = await orbis.deletePost(comment.stream_id)
    if (res.status === 200) {
      onDeleted(comment.stream_id)
    }
  }

  useEffect(() => {
    if (orbis && profile && comment) {
      getReacted()
      setUpvotes(comment.count_likes)
      setDownvotes(comment.count_downvotes)
    }
  }, [orbis, profile, comment])

  return (
    <div
      className={`p-6 border-b border-b-muted ${isDeleting && 'animate-pulse'}`}
    >
      {/* This comment is replying to */}
      {reply_to && reply_to !== subtopic.stream_id && (
        <div className="flex items-center gap-1 mb-1 opacity-70 select-none">
          <div className="w-8 h-8 relative before:block before:absolute before:w-5 before:h-4 before:right-0 before:bottom-0 before:rounded-tl-lg before:border-t-2 before:border-l-2 before:border-muted" />

          <div className="grow relative">
            <div className="absolute inset-0 flex items-center gap-1">
              <div className="shrink-0 w-6 h-6">
                <Avatar
                  size={24}
                  src={reply_to_creator_details?.profile?.pfp}
                  defaultSeed={didToAddress(reply_to_creator_details?.did)}
                />
              </div>

              <div className="shrink-0 font-title text-small font-bold">
                {getUsername(creator_details)}
              </div>

              <div className="text-small grow truncate">
                {reply_to_details?.body}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment header */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar
          src={creator_details?.profile?.pfp}
          defaultSeed={didToAddress(creator)}
        />
        <div className="text-small font-title">
          {getUsername(creator_details)}
        </div>
        <div className="text-small text-secondary">
          &middot; {formatDate(comment.timestamp)}
        </div>
        <div
          className={`badge badge-pill small ${
            creator === subtopic.creator ? 'bg-blue-medium' : 'bg-grey-medium'
          }`}
        >
          {creator === subtopic.creator ? 'Topic Creator' : 'Contributor'}
        </div>
      </div>

      {/* Comment title */}
      {comment.content?.title && (
        <h1 className="mb-1 font-title text-medium">{comment.content.title}</h1>
      )}

      {/* Comment body */}
      <div className="mb-4">{formatMessage(comment.content)}</div>

      {/* Comment election */}
      {comment.content?.data?.electionId && (
        <div className="mb-4">
          <Election electionId={comment.content.data.electionId} />
        </div>
      )}

      {/* Comment actions */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-2"
          onClick={() => reacting('like')}
          disabled={reacted === 'like'}
        >
          <div
            className={`btn btn-circle small ${
              reacted === 'like'
                ? 'bg-primary text-blue-dark'
                : 'bg-blue-medium text-white'
            }`}
          >
            <UpvoteIcon size="1.25rem" />
          </div>
          <span className="text-small">{upvotes}</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2"
          onClick={() => reacting('downvote')}
          disabled={reacted === 'downvote'}
        >
          <div
            className={`btn btn-circle small ${
              reacted === 'downvote'
                ? 'bg-primary text-blue-dark'
                : 'bg-blue-medium text-white'
            }`}
          >
            <DownvoteIcon size="1.25rem" />
          </div>
          <span className="text-small">{downvotes}</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2"
          onClick={() => onReply(comment)}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-medium">
            <ReplyIcon size="0.85rem" />
          </div>
          <span className="text-small">Reply</span>
        </button>

        <div className="ml-auto">
          {profile?.did === comment.creator && (
            <>
              <Popover
                side="top"
                trigger={
                  <button
                    className="btn btn-circle small bg-blue-lightest"
                    title="Options"
                  >
                    <EllipsisIcon size="1rem" />
                  </button>
                }
                open={openOptions}
                onOpenChange={setOpenOptions}
              >
                <div className="flex flex-col p-1 gap-1 min-w-[120px]">
                  <button
                    className="flex items-center justify-center gap-1 rounded-lg py-1 px-2 hover:bg-primary"
                    onClick={() => onEdit(comment)}
                  >
                    <EditIcon size="1.25rem" />
                    <span>Edit</span>
                  </button>
                  <button
                    className="flex items-center justify-center gap-1 rounded-lg py-1 px-2 text-red hover:bg-red hover:text-white"
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    <DeleteIcon size="1.25rem" />
                    <span>Delete</span>
                  </button>
                </div>
              </Popover>
              <AlertDialog
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
                title="Delete Comment"
                description="Are you sure you want to delete this comment? This action cannot be undone."
                confirmText="Delete Comment"
                onConfirm={handleDelete}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Comment
