interface TopicsQuery {
  context?: string
  did?: string
  master?: string
  only_master?: boolean
  tag?: string
  algorithm?: keyof typeof IOrbisGetPostsAlgorithm
}

interface IGetTopics {
  reset?: boolean
  polling?: boolean
}

import { useState, useEffect, memo } from 'react'
import { useInterval } from 'react-use'
import { useOrbis } from '../contexts/orbis'
import { useAppData } from '../contexts/appData'

import Loading from './Loading'
import Topic from './Topic'

const Topics = ({ query }: { query?: TopicsQuery }) => {
  const { orbis, appContext, profile } = useOrbis()
  const { setShowTopicDialog } = useAppData()

  const [initialized, setInitialized] = useState<boolean>(false)
  const [topics, setTopics] = useState<IOrbisPost[]>([])
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [pausePoll, setPausePoll] = useState<boolean>(false)
  const [unreads, setUnreads] = useState<IOrbisPost[]>([])

  const getTopics: (options?: IGetTopics) => Promise<void> = async (
    options
  ) => {
    if (!orbis || isLoading) return

    const _topics = options?.reset ? [] : [...topics]

    if (!options?.polling) {
      setPausePoll(true)
      setIsLoading(true)
    }

    const _query = { ...query, context: query?.context || appContext }

    const { data, error } = await orbis.getPosts(
      { ..._query },
      options?.polling || options?.reset ? 0 : currentPage
    )

    if (error) {
      console.error(error)
    }

    if (data) {
      if (!options?.polling) {
        setTopics([..._topics, ...data])
        const nextPage = options?.reset ? 1 : currentPage + 1
        setCurrentPage(nextPage)
        setHasMore(data.length >= 50)
        setPausePoll(false)
        setIsLoading(false)
      } else {
        const _combined = [...unreads, ..._topics]
        const unique = data.filter(
          (a) => !_combined.some((b) => a.stream_id === b.stream_id)
        )
        if (unique.length > 0) {
          setUnreads([...unique, ...unreads])
        }
      }

      if (options?.reset) setInitialized(true)
    }
  }

  const removeTopic = (streamId: string) => {
    const _topics = [...topics]
    const index = _topics.findIndex((t) => t.stream_id === streamId)
    if (index > -1) {
      _topics.splice(index, 1)
      setTopics(_topics)
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
            className="btnbtn-pill bg-primary large"
            onClick={() => getTopics()}
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
        getTopics({ polling: true })
      }
    },
    pausePoll ? null : 15000
  )

  useEffect(() => {
    setCurrentPage(0)
    setTimeout(() => {
      getTopics({ reset: true })
    }, 100)
  }, [query])

  if (initialized && topics.length === 0) {
    return (
      <div className="flex flex-col items-center p-6">
        <div className="text-secondary mb-6">No topic found</div>
        {profile && (
          <button
            className="btnbtn-pill bg-primary large"
            onClick={() => setShowTopicDialog(true)}
          >
            + New Topic
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {unreads.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <button
            className="btnbtn-pill bg-primary large"
            onClick={() => {
              setTopics([...unreads, ...topics])
              setUnreads([])
            }}
          >
            Show {unreads.length} New {unreads.length > 1 ? 'topics' : 'topic'}
          </button>
        </div>
      )}

      {topics.map((topic) => (
        <Topic key={topic.stream_id} post={topic} onDeleted={removeTopic} />
      ))}

      {bottomComponent()}
    </>
  )
}

export default memo(Topics)
