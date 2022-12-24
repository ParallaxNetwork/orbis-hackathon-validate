import { useEffect } from 'react'
import { PassportReader } from '@gitcoinco/passport-sdk-reader'

const Test = () => {
  const reader = new PassportReader(
    'https://ceramic.passport-iam.gitcoin.co',
    '1'
  )
  
  const getPassport = async () => {
    const passport = await reader.getPassport(
      '0xF78384d10355338f68C0Cf4e05401494Da27913C'
    )
    console.log(passport)
  }

  useEffect(() => {
    getPassport()
  }, [])

  return <div>Test</div>
}

export default Test
