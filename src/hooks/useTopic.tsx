import { useState, useEffect } from 'react'
import { useInterval } from 'react-use'
import { useOrbis } from '../contexts/orbis'

export const useSubtopicsCount = (topic: IOrbisPost) => {
  const { orbis, appContext } = useOrbis()
  const [count, setCount] = useState<number>(0)
  const [data, setData] = useState<IOrbisPost[]>([])

  const countSubtopics = async () => {
    const { data, error, count } = await orbis.api
      .from('orbis_v_posts')
      .select('*', { count: 'exact' })
      .eq('context', appContext)
      .eq('reply_to', topic.stream_id)

    if (error) {
      setCount(0)
    }

    if (count) {
      setCount(count)
      setData(data)
    }
  }

  useInterval(() => {
    countSubtopics()
  }, 15000)

  useEffect(() => {
    countSubtopics()
  }, [topic, orbis, appContext])

  return { data, count }
}

export const useContributorsCount = (topic: IOrbisPost) => {
  const { orbis, appContext } = useOrbis()
  const [count, setCount] = useState<number>(0)
  const [data, setData] = useState<string[]>([])

  const { data: subtopics } = useSubtopicsCount(topic)

  const countContributors = async () => {
    const subtopicsIds = subtopics.map((subtopic) => subtopic.stream_id)

    const { data, error } = await orbis.api
      .from('orbis_v_posts')
      .select('creator')
      .eq('context', appContext)
      .in('master', subtopicsIds)

    if (error) {
      console.error(error)
      setCount(0)
    }

    if (data) {
      // Get unique by creator and create an array of strings
      const unique = [
        ...new Set(data.map((item: { creator: string }) => item.creator))
      ]
      setCount(unique.length)
      setData(unique as string[])
    }
  }

  useInterval(() => {
    countContributors()
  }, 15000)

  useEffect(() => {
    if (subtopics.length > 0) {
      countContributors()
    }
  }, [subtopics, orbis, appContext])

  return { data, count }
}

export const useDiscussionsCount = (topic: IOrbisPost) => {
  const { orbis, appContext } = useOrbis()
  const [count, setCount] = useState<number>(0)

  const countDiscussions = async () => {
    const { count, error } = await orbis.api
      .from('orbis_v_posts')
      .select('*', { count: 'exact' })
      .eq('context', appContext)
      .eq('master', topic.stream_id)
      .not('reply_to', 'eq', topic.stream_id)

    if (error) {
      console.error(error)
      setCount(0)
    }

    if (count) {
      setCount(count)
    }
  }

  useInterval(() => {
    countDiscussions()
  }, 15000)

  useEffect(() => {
    countDiscussions()
  }, [topic, orbis, appContext])

  return { count }
}
