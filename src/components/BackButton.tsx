import { Link } from 'react-router-dom'
import { HiArrowLeft as BackIcon } from 'react-icons/hi'

const BackButton = ({ link }: { link: string }) => {
  return (
    <Link to={link} className="btn btn-circle bg-primary">
      <BackIcon size="1.25rem" />
    </Link>
  )
}

export default BackButton
