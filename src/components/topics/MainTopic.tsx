import { useState, useEffect } from 'react'
import { useOrbis } from '../../contexts/orbis'

const MainTopic = ({ post }: { post: IOrbisPost }) => {
  const { orbis } = useOrbis()

  const [topic, setTopic] = useState<IOrbisPost | null>(null)

  const getDetails: () => Promise<void> = async () => {
    const { data, error } = await orbis.getPost(post.stream_id)

    if (error) console.log(error)

    if (data) {
      setTopic(data)
    }
  }

  useEffect(() => {
    if (orbis && post) getDetails()
  }, [orbis, post])

  if (!topic) {
    return <div>Loading...</div>
  }

  return (
    <div className="px-6 py-4 border-b border-b-muted">
      <p>{topic.content.body}</p>
    </div>
  )
}

export default MainTopic
