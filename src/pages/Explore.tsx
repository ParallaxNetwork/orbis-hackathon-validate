import Search from '../components/shared/Search'
import Topics from '../components/topics'

const Home = () => {
  return (
    <>
      <div className="px-6 pb-6 border-b border-b-muted">
        <Search />
      </div>
      <div className="px-6 pb-6 border-b border-b-muted">
        <Topics
          query={{
            context:
              'kjzl6cwe1jw145gun3sei0a4puw586yxa614le1tfh434y7quv2wsm0ivhbge7x',
            algorithm: 'all-context-master-posts'
          }}
        />
      </div>
    </>
  )
}

export default Home
