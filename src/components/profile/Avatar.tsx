import React from 'react'
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'

interface AvatarProps {
  src?: string
  defaultSeed?: string
  size?: number
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  defaultSeed = '',
  size = 24
}) => {
  const _src = src?.startsWith('ipfs://')
    ? src.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : src

  if (!src && !defaultSeed) {
    return (
      <div
        className="rounded-full overflow-hidden bg-white"
        style={{ width: size, height: size }}
      />
    )
  }

  return _src ? (
    <img
      src={_src}
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
