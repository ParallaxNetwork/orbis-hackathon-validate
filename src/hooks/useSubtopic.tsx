import { useState, useEffect } from 'react'
import { useInterval } from 'react-use'
import { useOrbis } from '../contexts/orbis'
import { filterExpiredCredentials } from '../utils/orbis'

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
      const uniqueDids = [
        ...new Set(data.map((item: { creator: string }) => item.creator))
      ]
      setData(uniqueDids as string[])
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

export const useVerifiedContributors = (
  contributors: string[],
  vcs: string[]
) => {
  const { orbis } = useOrbis()
  const [data, setData] = useState<string[]>([])

  const getVerified = async () => {
    if (!contributors.length) {
      setData([])
      return
    }

    if (!vcs.length) {
      setData(contributors)
      return
    }

    const promises = contributors.map(async (did) => {
      const { data } = await orbis.getCredentials(did as string)

      const eligible = new Promise((resolve) => {
        if (!data.length) resolve({ did, eligible: false })

        if (data.length) {
          const activeCredentials = filterExpiredCredentials(data)

          // Loop through data and return only null family
          const gitcoin = activeCredentials.filter(
            (item: IOrbisCredential) => item.family === null
          )

          // Compare each gitcoin provider with verifiable credentials
          const userVCs = gitcoin.filter((g: IOrbisCredential) =>
            vcs?.includes(g.provider as string)
          )

          resolve({
            did,
            eligible: userVCs.length === vcs.length
          })
        }
      })
      return eligible
    })
    const res = await Promise.all(promises as Promise<any>[])
    const verified = res.filter((r) => r.eligible).map((r) => r.did)
    setData(verified as string[])
  }

  useEffect(() => {
    getVerified()
  }, [contributors, orbis, vcs])

  return { data }
}
