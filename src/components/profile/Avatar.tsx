import React from 'react'
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'

interface AvatarProps {
  src?: string
  defaultSeed?: string
  size?: number
}

const Avatar: React.FC<AvatarProps> = ({ src, defaultSeed = '', size = 24 }) => {
  if (!src && !defaultSeed) {
    return (
      <div
        className="rounded-full overflow-hidden bg-white"
        style={{ width: size, height: size }}
      />
    )
  }

  return src ? (
    <img
      src={src}
      alt="Avatar"
      className="object-cover object-center rounded-full overflow-hidden"
      width={size}
      height={size}
    />
  ) : (
    <Jazzicon
      data-testid="jazzicon"
      diameter={size}
      seed={jsNumberForAddress(defaultSeed)}
    />
  )
}

export default Avatar
