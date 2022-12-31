import { useState, useEffect } from 'react'
import { useOrbis } from '../contexts/orbis'
import { useAppData } from '../contexts/appData'

import Topic from '../components/Topic'
import Loading from '../components/Loading'
import { Link } from 'react-router-dom'

const FavouritesPage = () => {
  const { orbis, appContext } = useOrbis()
  const { favourites } = useAppData()

  const [topics, setTopics] = useState<IOrbisPost[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [initialized, setInitialized] = useState(false)

  const getFavourites = async () => {
    if (isLoading) return

    setIsLoading(true)

    const { data, error } = await orbis.api
      .from('orbis_v_posts')
      .select()
      .eq('context', appContext)
      .in('stream_id', favourites)

    if (error) console.log(error)

    if (data) {
      setTopics(data)
    }

    setInitialized(true)
    setIsLoading(false)
  }

  useEffect(() => {
    if (orbis && favourites) getFavourites()
  }, [favourites, orbis])

  if (isLoading) {
    return (
      <div className="flex justify-center py-4 px-6">
        <Loading />
      </div>
    )
  }

  if (!topics.length && initialized) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-6">
        You have no favourites yet.
        <Link to="/" className="btn btn-primary btn-pill btn-pill large">
          Go to Explore Page
        </Link>
      </div>
    )
  }

  return (
    <>
      {topics.map((topic) => (
        <Topic key={topic.stream_id} post={topic} />
      ))}
    </>
  )
}

export default FavouritesPage
