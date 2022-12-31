import { useEffect, useState } from 'react'
import { useInterval } from 'react-use'
import { useOrbis } from '../contexts/orbis'
import Comment from './Comment'
import CommentBox from './CommentBox'
import Loading from './Loading'

interface IGetComments {
  polling?: boolean
  reset?: boolean
}

const Comments = ({ subtopic }: { subtopic: IOrbisPost }) => {
  const { orbis, appContext } = useOrbis()

  const [initialized, setInitialized] = useState<boolean>(false)
  const [comments, setComments] = useState<IOrbisPost[]>([])
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [pausePoll, setPausePoll] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [unreads, setUnreads] = useState<IOrbisPost[]>([])
  const [replyTo, setReplyTo] = useState<IOrbisPost | null>(null)

  const getComments: (options?: IGetComments) => Promise<void> = async (
    options
  ) => {
    if (!orbis || isLoading) return

    const _comments = options?.reset ? [] : [...comments]

    if (!options?.polling) {
      setPausePoll(true)
      setIsLoading(true)
    }

    const { data, error } = await orbis.getPosts(
      {
        context: appContext,
        master: subtopic.stream_id
      },
      currentPage
    )

    if (error) {
      console.error(error)
    }

    if (data) {
      if (!options?.polling) {
        setComments([..._comments, ...data])
        const nextPage = options?.reset ? 1 : currentPage + 1
        setCurrentPage(nextPage)
        setHasMore(data.length >= 50)
        setPausePoll(false)
        setIsLoading(false)
      } else {
        const unique = data.filter(
          (a) => !_comments.some((b) => a.stream_id === b.stream_id)
        )
        if (unique.length > 0) {
          setUnreads([...unique, ...unreads])
        }
      }

      if (options?.reset) setInitialized(true)
    }
  }

  const onCommentCreated = (comment: IOrbisPost | undefined) => {
    if (!comment) return
    console.log(comment)
    setComments([comment, ...comments])
  }

  const removeComment = (streamId: string) => {
    const _topics = [...comments]
    const index = _topics.findIndex((t) => t.stream_id === streamId)
    if (index > -1) {
      _topics.splice(index, 1)
      setComments(_topics)
    }
  }

  const bottomComponent = () => {
    if (isLoading) {
      return (
        <div className="py-4">
          <Loading />
        </div>
      )
    } else if (hasMore) {
      return (
        <div className="py-4">
          <button
            className="btn btn-primary btn-pill btn-pill large"
            onClick={() => getComments()}
          >
            Load More
          </button>
        </div>
      )
    } else {
      return null
    }
  }

  useInterval(
    () => {
      if (!pausePoll) {
        getComments({ polling: true })
      }
    },
    pausePoll ? null : 15000
  )

  useEffect(() => {
    if (subtopic) {
      setCurrentPage(0)
      setTimeout(() => {
        getComments({ reset: true })
      }, 100)
    }
  }, [subtopic])

  return (
    <>
      <div className="py-4 px-6 sticky top-0 border-b border-b-muted bg-blue-dark">
        <CommentBox
          subtopic={subtopic}
          callback={(res) => onCommentCreated(res?.post)}
          replyTo={replyTo}
        />
      </div>

      {initialized && comments.length === 0 ? (
        <div className="flex flex-col items-center p-6">
          <div className="text-secondary mb-6">No comment found</div>
        </div>
      ) : (
        <>
          {comments.map((comment) => (
            <Comment
              key={comment.stream_id}
              comment={comment}
              subtopic={subtopic}
              onDeleted={removeComment}
              onReply={setReplyTo}
            />
          ))}
        </>
      )}

      {bottomComponent()}
    </>
  )
}

export default Comments
