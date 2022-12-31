import { useEffect } from 'react'
import { PassportReader } from '@gitcoinco/passport-sdk-reader'
import { useOrbis } from '../contexts/orbis'

const TestPage = () => {
  const { orbis } = useOrbis()

  const getPost = async () => {
    const res = await orbis.getPost(
      'kjzl6cwe1jw14anhwmdqbsu2fiz9pxpwt2a9vlk4r9k1hgbayy16rfdyvux1qcv'
    )
    console.log(res)
  }

  // const reader = new PassportReader(
  //   'https://ceramic.passport-iam.gitcoin.co',
  //   '1'
  // )

  // const getPassport = async () => {
  //   const passport = await reader.getPassport(
  //     '0xF78384d10355338f68C0Cf4e05401494Da27913C'
  //   )
  //   console.log(passport)
  // }

  // const getGroup = async () => {
  //   const res = await orbis.getGroup(
  //     'kjzl6cwe1jw147uz1k8xl5jdbperp0lxq6w1iybz3jbex3h4c24mywi9y2t7ynv'
  //   )
  //   console.log(res)
  // }

  // const getPost = async () => {
  //   const res = await orbis.getPost(
  //     'kjzl6cwe1jw14b4fgsqxbiian3ctlc4r2pe6u6xfcexhw0vtlmrljpj8pxuq4sh'
  //   )
  //   console.log(res)
  // }

  // useEffect(() => {
  //   getPassport()
  // }, [])

  // useEffect(() => {
  //   getGroup()
  //   getPost()
  // }, [orbis])

  useEffect(() => {
    getPost()
  }, [orbis])

  return <div>Test</div>
}

export default TestPage
