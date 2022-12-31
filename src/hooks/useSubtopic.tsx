import { useState, useEffect } from 'react'
import { useInterval } from 'react-use'
import { useOrbis } from '../contexts/orbis'

export const useContributors = (subtopic: IOrbisPost | null) => {
  const { orbis, appContext } = useOrbis()
  const [data, setData] = useState<string[]>([])

  const getContributors = async () => {
    if (!subtopic) {
      setData([])
      return
    }

    const { data, error } = await orbis.api
      .from('orbis_v_posts')
      .select('creator')
      .eq('context', appContext)
      .eq('master', subtopic.stream_id)

    if (error) {
      console.error(error)
      setData([])
    }

    if (data) {
      // Get unique by creator and create an array of strings
      const unique = [
        ...new Set(data.map((item: { creator: string }) => item.creator))
      ]
      setData(unique as string[])
    }
  }

  useInterval(() => {
    getContributors()
  }, 15000)

  useEffect(() => {
    getContributors()
  }, [subtopic, orbis, appContext])

  return { data }
}

export const useCommentsCount = (subtopic: IOrbisPost | null) => {
  const { orbis, appContext } = useOrbis()
  const [count, setCount] = useState<number>(0)

  const countComments = async () => {
    if (!subtopic) {
      setCount(0)
      return
    }

    const { count, error } = await orbis.api
      .from('orbis_v_posts')
      .select('*', { count: 'exact' })
      .eq('context', appContext)
      .eq('master', subtopic.stream_id)

    if (error) {
      console.error(error)
      setCount(0)
    }

    if (count) {
      setCount(count)
    }
  }

  useInterval(() => {
    countComments()
  }, 15000)

  useEffect(() => {
    countComments()
  }, [subtopic, orbis, appContext])

  return { count }
}
