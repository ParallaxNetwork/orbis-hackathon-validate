interface IGetSubtopics {
  reset?: boolean
  polling?: boolean
}

import { useState, useEffect, memo } from 'react'
import { useInterval } from 'react-use'
import { useOrbis } from '../contexts/orbis'

import Loading from './Loading'
import Subtopic from './Subtopic'

const Subtopics = ({ topic }: { topic: IOrbisPost }) => {
  const { orbis, appContext } = useOrbis()

  const [initialized, setInitialized] = useState<boolean>(false)
  const [subtopics, setSubtopics] = useState<IOrbisPost[]>([])
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [pausePoll, setPausePoll] = useState<boolean>(false)
  const [unreads, setUnreads] = useState<IOrbisPost[]>([])

  const getSubtopics: (options?: IGetSubtopics) => Promise<void> = async (
    options
  ) => {
    if (!orbis || isLoading) return

    const _subtopics = options?.reset ? [] : [...subtopics]

    if (!options?.polling) {
      setPausePoll(true)
      setIsLoading(true)
    }

    const { data, error } = await orbis.api
      .from('orbis_v_posts')
      .select('*')
      .eq('context', appContext)
      .eq('reply_to', topic.stream_id)
      .order('timestamp', { ascending: false })
      .range(currentPage * 50, currentPage + 1 * 50 - 1)

    if (error) {
      console.error(error)
    }

    if (data) {
      if (!options?.polling) {
        setSubtopics([..._subtopics, ...data])
        const nextPage = options?.reset ? 1 : currentPage + 1
        setCurrentPage(nextPage)
        setHasMore(data.length >= 50)
        setPausePoll(false)
        setIsLoading(false)
      } else {
        const unique = data.filter(
          (a: IOrbisPost) =>
            !_subtopics.some((b) => a.stream_id === b.stream_id)
        )
        if (unique.length > 0) {
          setUnreads([...unique, ...unreads])
        }
      }

      if (options?.reset) setInitialized(true)
    }
  }

  const removeTopic = (streamId: string) => {
    const _subtopics = [...subtopics]
    const index = _subtopics.findIndex((t) => t.stream_id === streamId)
    if (index > -1) {
      _subtopics.splice(index, 1)
      setSubtopics(_subtopics)
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
            className="btn btn-pill bg-primary large"
            onClick={() => getSubtopics()}
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
        getSubtopics({ polling: true })
      }
    },
    pausePoll ? null : 15000
  )

  useEffect(() => {
    setCurrentPage(0)
    setTimeout(() => {
      getSubtopics({ reset: true })
    }, 100)
  }, [topic])

  if (initialized && subtopics.length === 0) {
    return (
      <div className="flex flex-col items-center p-6">
        <div className="text-secondary">No subtopic found</div>
      </div>
    )
  }

  return (
    <div>
      {unreads.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <button
            className="btn btn-pill bg-primary large"
            onClick={() => setUnreads([])}
          >
            {unreads.length} New {unreads.length > 1 ? 'subtopics' : 'subtopic'}{' '}
            Found
          </button>
        </div>
      )}

      {subtopics.map((subtopic) => (
        <Subtopic
          key={subtopic.stream_id}
          post={subtopic}
          onDeleted={removeTopic}
        />
      ))}

      {bottomComponent()}
    </div>
  )
}

export default memo(Subtopics)
