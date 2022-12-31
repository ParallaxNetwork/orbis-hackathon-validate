import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useOrbis } from '../contexts/orbis'

import Topic from '../components/Topic'
import Subtopics from '../components/Subtopics'
import Loading from '../components/Loading'
import SubtopicDialog from '../components/SubtopicDialog'

const TopicPage = () => {
  const { topicId } = useParams()
  const { orbis, profile } = useOrbis()
  const navigate = useNavigate()

  const [topic, setTopic] = useState<IOrbisPost>()
  const [showSubtopicDialog, setShowSubtopicDialog] = useState<boolean>(false)

  const getTopicDetails = async () => {
    const { data, error } = await orbis.getPost(topicId as string)
    if (error) console.log(error)
    if (data) setTopic(data)
  }

  useEffect(() => {
    if (topicId) {
      getTopicDetails()
    }
  }, [topicId])

  if (!topic) {
    return (
      <div className="p-6">
        <Loading />
      </div>
    )
  }

  return (
    <>
      <Topic post={topic} onDeleted={() => navigate('/')} backTo="/" />
      <div className="flex justify-center border-b border-b-muted">
        {profile && profile?.did === topic.creator && (
          <>
            <button
              className="btn btn-pill bg-primary my-4 mx-6"
              onClick={() => setShowSubtopicDialog(true)}
            >
              + Add Subtopic
            </button>
            <SubtopicDialog
              showDialog={showSubtopicDialog}
              setShowDialog={setShowSubtopicDialog}
              callback={(res) => {
                if (res && res.streamId) {
                  setTimeout(() => {
                    navigate(`/topic/${topicId}/${res.streamId}`)
                  }, 1000)
                }
              }}
            />
          </>
        )}
      </div>
      <Subtopics topic={topic} />
    </>
  )
}

export default TopicPage
