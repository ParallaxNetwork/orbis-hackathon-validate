import { useSearchParams } from 'react-router-dom'
import Search from '../components/shared/Search'
import Topics from '../components/Topics'

const ExplorePage = () => {
  const [searchParams] = useSearchParams()
  const tag = searchParams.get('tag')
  let query: any = { algorithm: 'all-context-master-posts' }

  if (tag) {
    console.log(tag)
    query = { tag, only_master: true }
  }

  return (
    <>
      <div className="p-6 border-b border-b-muted">
        <Search />
      </div>
      <Topics query={query} />
    </>
  )
}

export default ExplorePage
