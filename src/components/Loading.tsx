import { CgSpinner } from 'react-icons/cg'

const Loading = ({ text = 'Loading...' }: { text?: string }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <CgSpinner className="animate-spin" size="1.5rem" />
      <span>{text}</span>
    </div>
  )
}

export default Loading
