import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  HiArrowSmUp as UpvoteIcon,
  HiArrowSmDown as DownvoteIcon,
  HiDotsVertical as EllipsisIcon,
  HiPencil as EditIcon,
  HiTrash as DeleteIcon,
  HiOutlineCalendar as CalendarIcon
} from 'react-icons/hi'
import { useOrbis } from '../contexts/orbis'
import { useContributors, useCommentsCount } from '../hooks/useSubtopic'
import {
  didToAddress,
  getUsername,
  shortAddress,
  formatDate,
  getMediaUrl
} from '../utils/orbis'

import Avatar from './profile/Avatar'
import Popover from './shared/Popover'
import AlertDialog from './shared/AlertDialog'
import BackButton from './BackButton'
import SubtopicDialog from './SubtopicDialog'

const LoadingAnimation = () => {
  return (
    <div className="px-6 py-4 border-b border-b-muted animate-pulse">
      <div className="mb-4 flex items-center max-w-full justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-white/20" />
            <div className="w-32 h-3 rounded-full bg-white/20" />
          </div>
          <div className="w-56 h-6 rounded-full bg-white/20" />
        </div>
        <div className="shrink-0 inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20" />
        </div>
      </div>
      <div className="mb-4">
        <div className="w-full h-3 rounded-full bg-white/20 mb-2" />
        <div className="w-full h-3 rounded-full bg-white/20 mb-2" />
        <div className="w-32 h-3 rounded-full bg-white/20" />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="w-24 h-3 rounded-full bg-white/20" />
        <div className="w-24 h-3 rounded-full bg-white/20" />
        <div className="w-24 h-3 rounded-full bg-white/20" />
      </div>
    </div>
  )
}

const Subtopic = ({
  post,
  backTo,
  onDeleted
}: {
  post: IOrbisPost
  backTo?: string
  onDeleted?: (topicId: string) => void
}) => {
  const { orbis, profile } = useOrbis()
  const { count: commentsCount } = useCommentsCount(post)
  const { data: contributors } = useContributors(post)

  const [showSubtopicDialog, setShowSubtopicDialog] = useState<boolean>(false)
  const [subtopic, setSubtopic] = useState<IOrbisPost | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [openOptions, setOpenOptions] = useState<boolean>(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [reacted, setReacted] = useState<string>('')

  const getDetails: () => Promise<void> = async () => {
    setIsLoading(true)
    const { data, error } = await orbis.getPost(post.stream_id)
    if (error) console.log(error)
    if (data) {
      setSubtopic(data)
      setIsLoading(false)
    }
  }

  const getReacted: () => Promise<void> = async () => {
    if (!profile || !orbis) return
    const { data, error } = await orbis.getReaction(post.stream_id, profile.did)
    if (error) console.log(error)
    if (data) {
      setReacted(data.type)
    }
  }

  const reacting: (type: string) => Promise<void> = async (type) => {
    if (!profile || !orbis) return
    const res = await orbis.react(post.stream_id, type)
    if (res.status === 200) {
      setReacted(type)
    }
  }

  const handleDelete: () => Promise<void> = async () => {
    setIsDeleting(true)
    const res = await orbis.deletePost(post.stream_id)
    if (res.status === 200 && onDeleted) {
      onDeleted(post.stream_id)
    }
  }

  useEffect(() => {
    if (orbis && post) {
      getDetails()
      getReacted()
    }
  }, [orbis, post])

  if (!subtopic || isLoading) {
    return <LoadingAnimation />
  }

  return (
    <div
      className={`px-6 py-4 border-b border-b-muted ${
        isDeleting && 'animate-pulse'
      }`}
    >
      <header className="mb-2 flex items-center max-w-full justify-between gap-4">
        <div className="flex items-center gap-2">
          {backTo && <BackButton link={backTo} />}
          <Link
            to={`/topic/${subtopic.reply_to}/${subtopic.stream_id}`}
            className="grow text-large font-title truncate"
          >
            {subtopic.content?.title ??
              `Untitled Subtopic - ${shortAddress(subtopic.stream_id)}`}
          </Link>
        </div>
        <div className="shrink-0 inline-flex items-center gap-2">
          {profile?.did === subtopic.creator && (
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
                    onClick={() => setShowSubtopicDialog(true)}
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
                title="Delete Subtopic"
                description="Are you sure you want to delete this subtopic? This action cannot be undone."
                confirmText="Delete Topic"
                onConfirm={handleDelete}
              />
              <SubtopicDialog
                showDialog={showSubtopicDialog}
                setShowDialog={setShowSubtopicDialog}
                subtopic={subtopic}
                callback={(res) => {
                  setShowSubtopicDialog(false)
                  if (res && res.content && res.reload) {
                    setSubtopic({
                      ...subtopic,
                      content: res.content
                    })
                  }
                }}
              />
            </>
          )}
        </div>
      </header>
      <div className="flex items-center gap-1 mb-3">
        <div className="inline-flex items-center gap-2">
          <CalendarIcon size="1.25rem" />
          <span className="text-small text-secondary">
            {formatDate(subtopic.timestamp)}
          </span>
        </div>
        <span className="text-small text-secondary">by</span>
        <Link
          to={`/profile/${didToAddress(subtopic.creator)}`}
          className="inline-flex gap-2 items-center"
        >
          <Avatar
            src={subtopic.creator_details?.profile?.pfp}
            defaultSeed={didToAddress(subtopic.creator_details?.did)}
            size={24}
          />
          <div className="text-small font-title">
            {getUsername(subtopic.creator_details)}
          </div>
        </Link>
      </div>
      <div className="mb-4">{subtopic.content.body}</div>
      {subtopic.content?.media && subtopic.content?.media.length > 0 && (
        <div
          className={`grid grid-flow-col gap-2 mb-4 ${
            subtopic.content.media.length > 2 && 'grid-cols-3'
          }`}
        >
          {subtopic.content.media.map((media, index) => (
            <div className="rounded-lg overflow-hidden" key={index}>
              <img
                src={getMediaUrl(media)}
                alt=""
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}
        </div>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-4 mb-4 font-title">
        <div className="flex items-center gap-4">
          <button
            className={`flex items-center gap-1.5 ${
              reacted === 'like' && 'bg-primary'
            }`}
            onClick={() => reacting('like')}
            disabled={reacted === 'like'}
          >
            <div className="btn btn-circle small bg-blue-medium text-white">
              <UpvoteIcon size="1rem" />
            </div>
            <span>{subtopic.count_likes}</span>
          </button>
          <button
            className={`flex items-center gap-1.5 ${
              reacted === 'downvote' && 'bg-primary'
            }`}
            onClick={() => reacting('downvote')}
            disabled={reacted === 'downvote'}
          >
            <div className="btn btn-circle small bg-blue-medium text-white">
              <DownvoteIcon size="1rem" />
            </div>
            <span>{subtopic.count_downvotes}</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-small">
            {contributors.length}{' '}
            <span className="text-secondary">Contributors</span>
          </div>
          <div className="text-small">
            {commentsCount} <span className="text-secondary">Discussions</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Subtopic
