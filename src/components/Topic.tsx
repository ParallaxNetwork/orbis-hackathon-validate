import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineShare as ShareIcon,
  HiDotsVertical as EllipsisIcon,
  HiPencil as EditIcon,
  HiTrash as DeleteIcon,
  HiOutlineCalendar as CalendarIcon
} from 'react-icons/hi'
import { useOrbis } from '../contexts/orbis'
import { useAppData } from '../contexts/appData'

import {
  didToAddress,
  formatDate,
  getMediaUrl,
  getUsername,
  shortAddress
} from '../utils/orbis'

import {
  useSubtopicsCount,
  useContributorsCount,
  useDiscussionsCount
} from '../hooks/useTopic'

import Avatar from './profile/Avatar'
import Popover from './shared/Popover'
import AlertDialog from './shared/AlertDialog'
import BackButton from './BackButton'

const LoadingAnimation = () => {
  return (
    <div className="px-6 py-4 border-b border-b-muted animate-pulse last:border-b-0">
      <div className="mb-4 flex items-center max-w-full justify-between gap-4">
        <div className="w-56 h-6 rounded-full bg-white/20" />
        <div className="shrink-0 inline-flex items-center gap-2">
          <div className="w-36 h-8 rounded-full bg-white/20" />
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
      <div className="flex items-center gap-2">
        <div className="w-[24px] h-[24px] rounded-full bg-white/20" />
        <div className="w-32 h-3 rounded-full bg-white/20" />
      </div>
    </div>
  )
}

const Topic = ({
  post,
  backTo,
  onDeleted
}: {
  post: IOrbisPost
  backTo?: string
  onDeleted?: (topicId: string) => void
}) => {
  const { orbis, profile } = useOrbis()
  const {
    favourites,
    setShowTopicDialog,
    setEditTopic,
    addFavourite,
    removeFavourite
  } = useAppData()

  const { count: subtopicsCount } = useSubtopicsCount(post)
  const { count: contributorsCount } = useContributorsCount(post)
  const { count: discussionsCount } = useDiscussionsCount(post)

  const [topic, setTopic] = useState<IOrbisPost | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [openOptions, setOpenOptions] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false)

  const getDetails: () => Promise<void> = async () => {
    setIsLoading(true)
    const { data, error } = await orbis.getPost(post.stream_id)
    if (error) console.log(error)
    if (data) {
      setTopic(data)
      setIsLoading(false)
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
    if (orbis && post) getDetails()
  }, [orbis, post])

  if (!topic || isLoading) {
    return <LoadingAnimation />
  }

  return (
    <div
      className={`px-6 py-4 border-b border-b-muted ${
        isDeleting && 'animate-pulse'
      } last:border-b-0`}
    >
      <header className="mb-2 flex items-center max-w-full justify-between gap-4">
        <div className="flex items-center gap-2">
          {backTo && <BackButton link={backTo} />}
          <Link
            to={`/topic/${topic.stream_id}`}
            className="grow text-xlarge font-title truncate"
          >
            {topic.content?.title ??
              `Untitled Topic - ${shortAddress(topic.stream_id)}`}
          </Link>
        </div>
        <div className="shrink-0 inline-flex items-center gap-2">
          <button
            className={`btn btn-pill ${
              favourites?.includes(topic.stream_id)
                ? 'bg-primary'
                : 'bg-blue-lightest'
            }`}
            title="Add to favourite"
            onClick={() => {
              if (!favourites?.includes(topic.stream_id))
                addFavourite(topic.stream_id)
              else removeFavourite(topic.stream_id)
            }}
          >
            {favourites?.includes(topic.stream_id)
              ? 'Favourited'
              : '+ Favourite'}
          </button>
          <button className="btn btn-circle bg-blue-lightest" title="Share">
            <ShareIcon size="1.25rem" />
          </button>
          {profile?.did === topic.creator && (
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
                    onClick={() => {
                      setEditTopic(topic)
                      setShowTopicDialog(true)
                    }}
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
                title="Delete Topic"
                description="Are you sure you want to delete this topic? This action cannot be undone."
                confirmText="Delete Topic"
                onConfirm={handleDelete}
              />
            </>
          )}
        </div>
      </header>
      <div className="flex items-center gap-1 mb-3">
        <div className="inline-flex items-center gap-2">
          <CalendarIcon size="1.25rem" />
          <span className="text-small text-secondary">
            {formatDate(topic.timestamp)}
          </span>
        </div>
        <span className="text-small text-secondary">by</span>
        <Link
          to={`/profile/${didToAddress(topic.creator)}`}
          className="inline-flex gap-2 items-center"
        >
          <Avatar
            src={topic.creator_details?.profile?.pfp}
            defaultSeed={didToAddress(topic.creator_details?.did)}
            size={24}
          />
          <div className="text-small font-title">
            {getUsername(topic.creator_details)}
          </div>
        </Link>
      </div>
      <div className="flex gap-4">
        {topic.content?.media && topic.content?.media.length ? (
          <div className="shrink-0 w-1/3">
            <Link
              to={`/topic/${topic.stream_id}`}
              className="block aspect-video rounded-lg overflow-hidden bg-secondary"
            >
              <img
                src={getMediaUrl(topic.content.media[0])}
                alt=""
                className="w-full h-full object-cover object-center"
              />
            </Link>
          </div>
        ) : (
          ''
        )}
        <div className="grow">
          <div className="mb-4 text-secondary">
            {topic.content.body}
            {topic.count_commits > 1 && (
              <span className="text-small ml-1">(edited)</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-small font-bold">
              {subtopicsCount}{' '}
              <span className="text-grey-lighter">
                {subtopicsCount > 1 ? 'Subtopics' : 'Subtopic'}
              </span>
            </span>
            <div className="text-small font-bold">
              {contributorsCount}{' '}
              <span className="text-grey-lighter">
                {contributorsCount > 1 ? 'Contributors' : 'Contributor'}
              </span>
            </div>
            <div className="text-small font-bold">
              {discussionsCount}{' '}
              <span className="text-grey-lighter">
                {discussionsCount > 1 ? 'Discussions' : 'Discussion'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Topic
