import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrbis } from '../contexts/orbis'

import Subtopic from '../components/Subtopic'
import Comments from '../components/Comments'
import Loading from '../components/Loading'

const SubtopicPage = () => {
  const { topicId, subtopicId } = useParams()
  const { orbis } = useOrbis()
  const navigate = useNavigate()

  const [subtopic, setSubtopic] = useState<IOrbisPost | null>(null)

  const getSubtopicDetails = async () => {
    const { data, error } = await orbis.getPost(subtopicId as string)
    if (error) console.log(error)
    if (data) setSubtopic(data)
  }

  useEffect(() => {
    if (subtopicId) {
      console.log(subtopicId)
      getSubtopicDetails()
    }
  }, [subtopicId])

  if (!subtopic) {
    return (
      <div className="p-6">
        <Loading />
      </div>
    )
  }

  return (
    <>
      <Subtopic
        post={subtopic}
        backTo={`/topic/${topicId}`}
        onDeleted={() => navigate(`/topic/${topicId}`)}
      />
      
      <Comments subtopic={subtopic} />
    </>
  )
}

export default SubtopicPage
