import Search from '../components/shared/Search'
import Topics from '../components/Topics'

const ExplorePage = () => {
  return (
    <>
      <div className="p-6 border-b border-b-muted">
        <Search />
      </div>
      <Topics query={{ algorithm: 'all-context-master-posts' }} />
    </>
  )
}

export default ExplorePage
