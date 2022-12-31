import {
  VocdoniSDKClient,
  EnvOptions,
  PlainCensus,
  Election
} from '@vocdoni/sdk'

let client: VocdoniSDKClient

export const initVocdoniSDK = async (signer: any) => {
  client = new VocdoniSDKClient({
    env: EnvOptions.DEV,
    wallet: signer
  })

  return client
}

export const createAccount = async () => {
  const info = await client.createAccount()
  console.log(info) // will show account information
  return info
}

export const fetchAccount = async () => {
  const info = await client.fetchAccountInfo()
  console.log(info) // shows info (only if account exists, otherwise throws error)
  return info
}

export const requestTokens = async () => {
  const info = await createAccount()
  if (info.balance === 0) {
    await client.collectFaucetTokens()
  }
}

export const createCensus = async (addresses: string[]) => {
  const census = new PlainCensus()
  for (const address of addresses) {
    census.add(address)
  }
}

export const createElection = async (
  census: PlainCensus,
  questions: {
    title: string
    description: string
    choices: Array<{
      title: string
      value: number
    }>
  }[]
) => {
  const election = Election.from({
    title: 'Election title',
    description: 'Election description',
    // a header image for your process (this is for example purposes; avoid using random sources)
    streamUri: '',
    header: 'https://source.unsplash.com/random/2048x600',
    endDate: new Date('2023-01-23 23:23:23'),
    census
  })

  // Add questions
  for (const question of questions) {
    election.addQuestion(question.title, question.description, question.choices)
  }

  return await client.createElection(election)
}
