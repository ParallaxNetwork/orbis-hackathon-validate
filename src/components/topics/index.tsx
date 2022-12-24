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

import { useState, useEffect } from 'react'
import { useInterval } from 'react-use'
import { useOrbis } from '../../contexts/orbis'

import MainTopic from './MainTopic'

const Topics = ({ query }: { query?: TopicsQuery }) => {
  const { orbis } = useOrbis()

  const [topics, setTopics] = useState<IOrbisPost[]>([])
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [pausePoll, setPausePoll] = useState<boolean>(false)
  const [unreads, setUnreads] = useState<number>(0)

  const getTopics: (options?: IGetTopics) => Promise<void> = async (
    options
  ) => {
    if (!orbis || isLoading) return

    const _topics = options?.reset ? [] : [...topics]

    if (options?.polling) {
      setPausePoll(true)
      setIsLoading(true)
    }

    const { data, error } = await orbis.getPosts(
      { ...query },
      options?.polling || options?.reset ? 0 : currentPage
    )

    if (data) {
      if (!options?.polling) {
        setTopics([..._topics, ...data])
        const nextPage = options?.reset ? 1 : currentPage + 1
        setCurrentPage(nextPage)
        setHasMore(data.length >= 50)
        setPausePoll(false)
        setIsLoading(false)
      } else {
        const unique = data.filter(
          (a) => !_topics.some((b) => a.stream_id === b.stream_id)
        )
        if (unique.length > 0) {
          setTopics([...unique, ..._topics])
          setUnreads((prev) => prev + unique.length)
        }
      }
    }

    if (error) {
      console.error(error)
    }
  }

  useInterval(
    () => {
      if (!pausePoll) {
        getTopics({ polling: true })
      }
    },
    pausePoll ? null : 10000
  )

  useEffect(() => {
    console.log({ hasMore, unreads })
  }, [hasMore, unreads])

  useEffect(() => {
    if (query?.context) {
      setCurrentPage(0)
      setTimeout(() => {
        getTopics({ reset: true })
      }, 100)
    }
  }, [query])

  useEffect(() => {
    console.log(topics)
  }, [topics])

  return (
    <div>
      {topics.map((topic) => (
        <MainTopic key={topic.stream_id} post={topic} />
      ))}
    </div>
  )
}

export default Topics
