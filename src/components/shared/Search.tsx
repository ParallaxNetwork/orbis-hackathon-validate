import { useState, useEffect } from 'react'
import { useOrbis } from '../../contexts/orbis'
import { FiSearch as SearchIcon } from 'react-icons/fi'
import Topic from '../Topic'
import Loading from '../Loading'

const Search = () => {
  const { orbis, appContext } = useOrbis()
  const [search, setSearch] = useState<string>('')
  const [topics, setTopics] = useState<IOrbisPost[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const searchTopics: (
    e: React.FormEvent<HTMLFormElement>
  ) => Promise<void> = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    console.log('search topics')
    const { data, error } = await orbis.api
      .from('orbis_v_posts')
      .select()
      .eq('context', appContext)
      .is('master', null)
      .or(`content->>title.ilike.%${search}%,content->>body.ilike.%${search}%`)
      .order('timestamp', { ascending: false })

    if (error) console.log(error)
    if (data) {
      setTopics(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (!search.length) setTopics([])
  }, [search])

  return (
    <div className="relative">
      <form
        className="w-full flex items-center bg-blue-search rounded-full border border-transparent focus-within:border-blue-medium"
        onSubmit={searchTopics}
      >
        <div className="grow">
          <input
            type="search"
            className="appearance-none bg-transparent border-0 px-5 w-full placeholder:text-white/40 active:ring-0 focus:ring-0"
            value={search}
            placeholder="Search topics..."
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="shrink-0 mr-5">
          <SearchIcon size="1.25rem" />
        </button>
      </form>
      {isLoading && (
        <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-blue-dark border border-blue-medium rounded-lg shadow-lg max-h-[50vh] overflow-y-auto p-4">
          <Loading />
        </div>
      )}
      {topics.length > 0 && (
        <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-blue-dark border border-blue-medium rounded-lg shadow-lg max-h-[50vh] overflow-y-auto">
          {topics.map((topic) => (
            <Topic key={topic.stream_id} post={topic} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Search
