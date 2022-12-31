import { Link } from 'react-router-dom'
import reactStringReplace from 'react-string-replace'
import { DateTime } from 'luxon'

export const shortAddress = (address: string | undefined): string => {
  if (!address) return '-'
  const head = address.substring(0, 5)
  const tail = address.substring(address.length - 5)
  return head + '...' + tail
}

export const didToAddress = (
  did: string | undefined,
  short = false
): string => {
  if (!did) return ''
  const parts = did.split(':')
  return short ? shortAddress(parts[4]) : parts[4]
}

export const getUsername = (details: IOrbisProfile['details']): string => {
  return (
    details?.profile?.username ||
    details?.metadata?.ensName ||
    shortAddress(didToAddress(details?.did))
  )
}

export const getBadgeContent = (details: IOrbisProfile['details']): string => {
  return details?.metadata?.ensName || shortAddress(didToAddress(details?.did))
}

/** Regex patterns to use */
const patternMentions = /\B@[a-z0-9_.⍙-]+/gi

export const highlightMentions = (content: IOrbisPostContent) => {
  if (!content) return ''

  let { body } = content

  /** Get mentions in post metadata */
  const { mentions } = content

  /** Retrieve mentions in the body */
  const mentionsInBody = content.body.toString().match(patternMentions)

  /** Compare both and replace in body */
  if (mentionsInBody && mentions && Array.isArray(mentions)) {
    mentionsInBody.forEach((_m) => {
      /** Find mention with the same name */
      const mention = mentions.find((obj) => obj.username === _m)
      if (mention !== undefined) {
        body = body.replace(
          _m,
          `<span class="text-primary" contenteditable="false">${_m}</span>`
        )
      }
    })
  }

  // Replace &nbsp; with empty space
  const regexNbsp = new RegExp(String.fromCharCode(160), 'g')
  body = body.replace(regexNbsp, ' ')

  return body
}

export const formatMessage = (
  content: IOrbisPostContent,
  hideOverflow = false,
  overflowLimit = 0
) => {
  if (!content || !content.body) return null

  let _body: any = content.body

  if (overflowLimit > 0 && hideOverflow && _body.length > overflowLimit) {
    _body = _body.substring(0, overflowLimit)
    return _body + '...'
  }

  /** Replace all <br> generated by the postbox to \n to handle line breaks */
  _body = reactStringReplace(_body, '<br>', function (match, i) {
    return <br key={match + i} />
  })

  _body = reactStringReplace(_body, '\n', function (match, i) {
    return <br key={match + i} />
  })

  /** Replace URLs */
  _body = reactStringReplace(
    _body,
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g,
    function (match, i) {
      return (
        <a
          key={match + i}
          href={match}
          rel="noreferrer"
          target="_blank"
          title={match}
          className="text-primary"
        >
          {match}
        </a>
      )
    }
  )

  /** Identify and replace mentions */

  /** Get mentions in post metadata */
  const { mentions } = content

  /** Retrieve mentions in the body */
  const mentionsInBody = content.body.toString().match(patternMentions)

  /** Compare both and replace in body */
  if (mentionsInBody && mentions && Array.isArray(mentions)) {
    mentionsInBody.forEach((_m) => {
      /** Find mention with the same name */
      const mention = mentions.find((obj) => obj.username === _m)
      if (mention !== undefined) {
        _body = reactStringReplace(_body, _m, (match, i) =>
          mention.did ? (
            <Link
              key={match + i}
              to={`/profile/${didToAddress(mention.did)}`}
              target="_blank"
              className="text-primary"
              rel="noreferrer"
            >
              {mention.username}
            </Link>
          ) : (
            <span className="text-primary" key={match + i}>
              {mention.username}
            </span>
          )
        )
      }
    })
  }

  // Replace &nbsp; with empty space
  const regexNbsp = new RegExp(String.fromCharCode(160), 'g')
  _body = reactStringReplace(_body, regexNbsp, function (match) {
    return ' ' + match
  })

  return _body
}

export const formatDate = (timestamp: number) => {
  const now = DateTime.now()
  const date = DateTime.fromSeconds(timestamp)
  const diff = now.diff(date, ['days'])
  let res: string | null = date.toRelative()
  if (diff.get('days') > 3) {
    res = date.toLocaleString(DateTime.DATETIME_MED)
  }
  return res
}

export const filterExpiredCredentials = (credentials: IOrbisCredential[]) => {
  const now = DateTime.now()
  return credentials.filter((c) => {
    const expires = DateTime.fromISO(c.content?.expirationDate as string)
    return expires > now
  })
}

export const getMediaUrl = ({
  url,
  gateway
}: {
  url: string
  gateway?: string
}) => {
  if (!url) return ''
  const uri = url.replace('ipfs://', '')
  const _gateway = gateway || 'https://ipfs.io/ipfs/'
  return `${_gateway}${uri}`
}
