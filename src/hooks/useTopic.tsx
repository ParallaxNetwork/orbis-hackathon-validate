import { useState, useEffect } from 'react'
import { useInterval } from 'react-use'
import { useOrbis } from '../contexts/orbis'

export const useSubtopicsCount = (topic: IOrbisPost) => {
  const { orbis, appContext } = useOrbis()
  const [count, setCount] = useState<number>(0)

  const countSubtopics = async () => {
    const { error, count } = await orbis.api
      .from('orbis_v_posts')
      .select('*', { count: 'exact' })
      .eq('context', appContext)
      .eq('reply_to', topic.stream_id)

    if (error) {
      setCount(0)
    }

    if (count) {
      setCount(count)
    }
  }

  useInterval(() => {
    countSubtopics()
  }, 15000)

  useEffect(() => {
    countSubtopics()
  }, [topic, orbis, appContext])

  return { count }
}

export const useContributorsCount = (topic: IOrbisPost) => {
  const { orbis, appContext } = useOrbis()
  const [count, setCount] = useState<number>(0)

  const countContributors = async () => {
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
    countContributors()
  }, 15000)

  useEffect(() => {
    countContributors()
  }, [topic, orbis, appContext])

  return { count }
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
