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
import { didToAddress, getUsername, formatMessage } from '../utils/orbis'
import Avatar from './profile/Avatar'
import Popover from './shared/Popover'
import AlertDialog from './shared/AlertDialog'

const Comment = ({
  comment,
  subtopic,
  onReply,
  onDeleted
}: {
  comment: IOrbisPost
  subtopic: IOrbisPost
  onReply: (comment: IOrbisPost) => void
  onDeleted?: (commentId: string) => void
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

  const reacting = async (reaction: string) => {
    const res = await orbis.react(comment.stream_id, reaction)
    console.log(res)
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
    if (res.status === 200 && onDeleted) {
      onDeleted(comment.stream_id)
    }
  }

  useEffect(() => {
    if (orbis && profile && comment) getReacted()
  }, [orbis, profile, comment])

  return (
    <div
      className={`p-6 border-b border-b-muted ${isDeleting && 'animate-pulse'}`}
    >
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
      <div className="flex items-center gap-2 mb-2">
        <Avatar
          src={creator_details?.profile?.pfp}
          defaultSeed={didToAddress(creator)}
        />
        <div className="text-small font-title">
          {getUsername(creator_details)}
        </div>
        {creator === subtopic.creator && (
          <div className="bg-blue-medium py-1 px-4 rounded-full text-small">
            OP
          </div>
        )}
        <div className="ml-auto">
          {profile?.did === comment.creator && (
            <>
              <Popover
                trigger={
                  <button
                    className="btn btn-circle bg-blue-lightest"
                    title="Options"
                  >
                    <EllipsisIcon size="1.25rem" />
                  </button>
                }
                open={openOptions}
                onOpenChange={setOpenOptions}
              >
                <div className="flex flex-col p-1 gap-1 min-w-[120px]">
                  <button
                    className="flex items-center justify-center gap-1 rounded-lg py-1 px-2 hover:bg-primary"
                    onClick={() => console.log('edit')}
                  >
                    <EditIcon size="1.25rem" />
                    <span>Edit</span>
                  </button>
                  {onDeleted && (
                    <button
                      className="flex items-center justify-center gap-1 rounded-lg py-1 px-2 text-red hover:bg-red hover:text-white"
                      onClick={() => setShowDeleteAlert(true)}
                    >
                      <DeleteIcon size="1.25rem" />
                      <span>Delete</span>
                    </button>
                  )}
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
      <div className="mb-4">{formatMessage(comment.content)}</div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className={`inline-flex items-center gap-2 ${
            reacted === 'like' ? 'text-primary' : ''
          }`}
          onClick={() => reacting('like')}
          disabled={reacted === 'like'}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-medium">
            <UpvoteIcon size="1.25rem" />
          </div>
          <span className="text-small">{count_likes}</span>
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-2 ${
            reacted === 'downvote' ? 'text-primary' : ''
          }`}
          onClick={() => reacting('downvote')}
          disabled={reacted === 'downvote'}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-medium">
            <DownvoteIcon size="1.25rem" />
          </div>
          <span className="text-small">{count_downvotes}</span>
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
      </div>
    </div>
  )
}

export default Comment
