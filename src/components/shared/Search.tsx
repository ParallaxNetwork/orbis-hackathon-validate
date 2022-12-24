import { FiSearch } from 'react-icons/fi'

const Search = () => {
  return (
    <div className="w-full flex items-center bg-blue-search rounded-full border border-transparent focus-within:border-blue-active-input">
      <div className="grow">
        <input
          type="search"
          className="bg-transparent border-0 px-5 w-full active:ring-0 focus:ring-0"
          placeholder="Search"
        />
      </div>
      <button className="shrink-0 mr-5">
        <FiSearch size="1.25rem" />
      </button>
    </div>
  )
}

export default Search
