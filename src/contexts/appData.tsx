import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode
} from 'react'
import {
  useMatches,
  useLocation,
  useParams
} from 'react-router-dom'
import { useLocalStorage } from 'react-use'
import TopicDialog from '../components/TopicDialog'

interface IAppContext {
  masterId: string
  showTopicDialog: boolean
  setShowTopicDialog: (showTopicDialog: boolean) => void
  editTopic: IOrbisPost | null
  setEditTopic: (editTopic: IOrbisPost | null) => void
  favourites: string[] | undefined
  addFavourite: (id: string) => string[] | undefined
  removeFavourite: (id: string) => string[] | undefined
}

const AppDataContext = createContext({} as IAppContext)

const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const matches = useMatches()
  const { topicId } = useParams()

  const [activeHandle, setActiveHandle] = useState<string>('')
  const [showTopicDialog, setShowTopicDialog] = useState<boolean>(false)
  const [editTopic, setEditTopic] = useState<IOrbisPost | null>(null)
  const [favourites, setFavourites] = useLocalStorage<string[]>(
    'favourites',
    []
  )

  const addFavourite = (id: string) => {
    if (favourites?.includes(id)) return
    const _favourites = favourites ? [...favourites] : []
    const newFavourites = [..._favourites, id]
    setFavourites(newFavourites)
    return newFavourites
  }

  const removeFavourite = (id: string) => {
    if (!favourites?.includes(id)) return
    const _favourites = favourites ? [...favourites] : []
    const newFavourites = _favourites.filter((o) => o !== id)
    setFavourites(newFavourites)
    return newFavourites
  }

  const masterId = useMemo(() => {
    if (topicId && activeHandle === 'mainTopic') {
      return topicId
    }
    return ''
  }, [topicId, activeHandle])

  useEffect(() => {
    const match = matches.find((o) => o.pathname === location.pathname)
    if (match) {
      setActiveHandle(match.handle as string || '')
    } else setActiveHandle('')
  }, [location])

  useEffect(() => {
    if (!showTopicDialog) {
      setEditTopic(null)
    }
  }, [showTopicDialog])

  return (
    <AppDataContext.Provider
      value={{
        masterId,
        showTopicDialog,
        setShowTopicDialog,
        editTopic,
        setEditTopic,
        favourites,
        addFavourite,
        removeFavourite
      }}
    >
      {children}
      <TopicDialog
        showDialog={showTopicDialog}
        setShowDialog={setShowTopicDialog}
        topic={editTopic as IOrbisPost}
      />
    </AppDataContext.Provider>
  )
}

const useAppData = () => useContext(AppDataContext)

export { AppDataProvider, useAppData }
