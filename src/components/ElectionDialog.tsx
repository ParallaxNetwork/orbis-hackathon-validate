import { useState, useEffect, useMemo } from 'react'
import { PlainCensus, Election, IVoteType } from '@vocdoni/sdk'
import { DateTime } from 'luxon'
import {
  HiOutlineX as CloseIcon,
  HiPlus as PlusIcon,
  HiTrash as TrashIcon,
  HiArrowSmLeft as ArrowLeftIcon,
  HiArrowSmRight as ArrowRightIcon
} from 'react-icons/hi'
import { useOrbis } from '../contexts/orbis'
import { useVocdoni } from '../contexts/vocdoni'
import { useContributors } from '../hooks/useSubtopic'
import { didToAddress, filterExpiredCredentials } from '../utils/orbis'
import { gitcoinProviders } from '../utils/gitcoin'
import Dialog from './shared/Dialog'
import AlertDialog from './shared/AlertDialog'

const ElectionDialog = ({
  showDialog,
  setShowDialog,
  subtopic,
  onCreated
}: {
  showDialog: boolean
  setShowDialog: (show: boolean) => void
  subtopic: IOrbisPost
  onCreated: (election: {
    title: string
    description: string
    electionId: string
  }) => Promise<void>
}) => {
  const { orbis } = useOrbis()
  const { client: vocdoniClient } = useVocdoni()
  const { data: contributors } = useContributors(subtopic)

  const [formStep, setFormStep] = useState<number>(1)
  const [type, setType] = useState<string>('basic')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [days, setDays] = useState<number>(1)
  const [questions, setQuestions] = useState<
    {
      title: string
      description: string
      choices: Array<{
        title: string
        value: number
      }>
    }[]
  >([{ title: '', description: '', choices: [{ title: '', value: 0 }] }])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showConfirmationDialog, setShowConfirmationDialog] =
    useState<boolean>(false)
  const [vcs, setVcs] = useState<string[]>([])
  const [verified, setVerified] = useState<string[]>(contributors)
  const [useVerified, setUseVerified] = useState<boolean>(false)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)

  const resetStates = () => {
    setType('basic')
    setTitle('')
    setDescription('')
    setDays(1)
    setQuestions([
      { title: '', description: '', choices: [{ title: '', value: 0 }] }
    ])
    setVcs([])
    setVerified(contributors)
    setUseVerified(false)
  }

  const realContributors = useMemo(() => {
    if (vcs.length && useVerified) return verified
    return contributors
  }, [contributors, vcs, verified, useVerified])

  const isDisabled = useMemo(() => {
    if (formStep === 1 && (!type || !title || !description || !days)) {
      return true
    } else if (formStep === 2) {
      // Filter question with empty title
      const filteredQuestions = questions.filter((q) => q.title)

      // Check if filteredQuestions are valid
      if (!filteredQuestions.length) return true

      // Filter choices with empty title
      const filteredChoices = filteredQuestions.map((q) => {
        return q.choices.filter((c) => c.title)
      })

      // Check minimum of 2 choices
      if (filteredChoices.some((c) => c.length < 2)) return true

      // Check if filteredChoices are valid
      if (filteredChoices.some((c) => !c.length)) return true
    }

    if (!realContributors.length || isVerifying) return false

    return false
  }, [formStep, type, title, description, days, questions])

  const verifyContributors = async () => {
    if (isVerifying) return
    setIsVerifying(true)
    const promises = contributors.map(async (did) => {
      const { data } = await orbis.getCredentials(did as string)

      const eligible = new Promise((resolve) => {
        if (!data.length) resolve({ did, eligible: false })

        if (data.length) {
          const activeCredentials = filterExpiredCredentials(data)

          // Loop through data and return only null family
          const gitcoin = activeCredentials.filter(
            (item: IOrbisCredential) => item.family === null
          )

          // Compare each gitcoin provider with verifiable credentials
          const userVCs = gitcoin.filter((g: IOrbisCredential) =>
            vcs?.includes(g.provider as string)
          )

          resolve({ did, eligible: userVCs.length === vcs.length })
        }
      })
      return eligible
    })
    const res = await Promise.all(promises as Promise<any>[])
    const verified = res.filter((r) => r.eligible).map((r) => r.did)
    setVerified(verified)
    setUseVerified(true)
    setIsVerifying(false)
  }

  const createCensus = (): PlainCensus => {
    const census = new PlainCensus()
    census.add(realContributors.map((did) => didToAddress(did)))
    return census
  }

  const createElection = async () => {
    if (isDisabled || isSubmitting || !vocdoniClient) return

    setIsSubmitting(true)

    // Create the census using all contributors
    const census = createCensus()

    // Set voteType
    let voteType: IVoteType = {}
    if (type === 'ranked') {
      voteType = {
        uniqueChoices: true,
        maxVoteOverwrites: 1,
        costExponent: 1
      }
    }

    // Set election data
    const electionData = {
      title,
      description,
      voteType,
      header:
        'https://nftstorage.link/ipfs/bafkreicu6twm6vj5nsdmt6wahj5tvf5h5pels3v4jopjyijxoze6ltxxza',
      streamUri:
        'https://nftstorage.link/ipfs/bafkreicu6twm6vj5nsdmt6wahj5tvf5h5pels3v4jopjyijxoze6ltxxza',
      endDate: DateTime.now().plus({ days }).toJSDate(),
      census
    }

    // Create the election
    const election = Election.from(electionData)

    // Filter empty questions
    const filteredQuestions = questions.filter((q) => q.title)

    for (const question of filteredQuestions) {
      // Remove empty choices from this question
      const filteredChoices = question.choices.filter((c) => c.title)

      election.addQuestion(
        question.title,
        question.description,
        filteredChoices
      )
    }

    const electionId = await vocdoniClient.createElection(election)

    // Return the created election
    onCreated({
      electionId,
      title,
      description
    })
    setIsSubmitting(false)
    resetStates()
    setShowDialog(false)
  }

  useEffect(() => {
    if (!vcs.length) setUseVerified(false)
  }, [vcs])

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <div className="w-[735px] max-w-full p-6">
          <header className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-large font-title">
              {formStep === 1 && 'Election Details'}
              {formStep === 2 && 'Questions'}
              {formStep === 3 && 'Census'}
              {formStep === 4 && 'Review'}
            </h2>
            <button
              type="button"
              className="btn btn-circle bg-blue-medium"
              onClick={() => setShowDialog(false)}
            >
              <CloseIcon size="1.25rem" />
            </button>
          </header>
          {formStep === 1 && (
            <div className="mb-4">
              {/* Election Type */}
              <div className="mb-4 flex flex-col">
                <label
                  htmlFor="type"
                  className="text-small ml-2 mb-1 text-grey-lighter"
                >
                  Type <span className="text-red">*</span>
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required={true}
                  disabled={true}
                >
                  <option value="basic">Basic</option>
                  <option value="stream">Ranked</option>
                </select>
                <small className="text-grey-lighter mt-1 ml-2">
                  More options coming soon
                </small>
              </div>

              {/* Title */}
              <div className="mb-4 flex flex-col">
                <label
                  htmlFor="title"
                  className="text-small ml-2 mb-1 text-grey-lighter"
                >
                  Title <span className="text-red">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required={true}
                  maxLength={140}
                  placeholder="Election Title"
                />
              </div>

              {/* Description */}
              <div className="mb-4 flex flex-col">
                <label
                  htmlFor="description"
                  className="text-small ml-2 mb-1 text-grey-lighter"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Election description..."
                  required={true}
                />
              </div>

              {/* Voting Period */}
              <div className="mb-4 flex flex-col">
                <label
                  htmlFor="days"
                  className="text-small ml-2 mb-1 text-grey-lighter"
                >
                  Voting Period (in days) <span className="text-red">*</span>
                </label>
                <select
                  id="days"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  required={true}
                >
                  {[...Array(7)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div className="mb-4">
              <div className="flex flex-col">
                {questions.map((question, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-4 py-4 border-t border-t-muted first:border-t-0"
                  >
                    <div className="flex justify-between">
                      <div className="font-title text-medium">
                        Question {i + 1}
                      </div>
                      <button
                        type="button"
                        className="btn btn-circle bg-red"
                        onClick={() =>
                          setQuestions((prev) => {
                            const newQuestions = [...prev]
                            newQuestions.splice(i, 1)
                            return newQuestions
                          })
                        }
                      >
                        <TrashIcon size="1rem" />
                      </button>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-small ml-2 mb-1 text-grey-lighter last:border-0">
                        Title <span className="text-red">*</span>
                      </label>
                      <input
                        type="text"
                        value={question.title}
                        onChange={(e) =>
                          setQuestions((prev) => {
                            const newQuestions = [...prev]
                            newQuestions[i].title = e.target.value
                            return newQuestions
                          })
                        }
                        required={true}
                        maxLength={140}
                        placeholder="Question Title"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-small ml-2 mb-1 text-grey-lighter">
                        Description
                      </label>
                      <textarea
                        value={question.description}
                        onChange={(e) =>
                          setQuestions((prev) => {
                            const newQuestions = [...prev]
                            newQuestions[i].description = e.target.value
                            return newQuestions
                          })
                        }
                        placeholder="Question description..."
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-small ml-2 mb-1 text-grey-lighter">
                        Choices <span className="text-red">*</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        {question.choices.map((choice, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={choice.title}
                              onChange={(e) =>
                                setQuestions((prev) => {
                                  const newQuestions = [...prev]
                                  newQuestions[i].choices[j] = {
                                    title: e.target.value,
                                    value: j
                                  }
                                  return newQuestions
                                })
                              }
                              required={true}
                              maxLength={140}
                              placeholder={`Choice ${j + 1}`}
                            />
                            {j === question.choices.length - 1 ? (
                              <button
                                type="button"
                                className="btn btn-circle bg-blue-lightest gap-1"
                                onClick={() =>
                                  setQuestions((prev) => {
                                    const newQuestions = [...prev]
                                    newQuestions[i].choices.push({
                                      title: '',
                                      value: newQuestions[i].choices.length
                                    })
                                    return newQuestions
                                  })
                                }
                              >
                                <PlusIcon size="1.25rem" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-circle bg-red"
                                onClick={() =>
                                  setQuestions((prev) => {
                                    const newQuestions = [...prev]
                                    newQuestions[i].choices.splice(j, 1)
                                    return newQuestions
                                  })
                                }
                              >
                                <CloseIcon size="1.25rem" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center py-4 border-t border-t-muted">
                  <button
                    type="button"
                    className="btn btn-pill bg-blue-lightest gap-1"
                    onClick={() =>
                      setQuestions((prev) => [
                        ...prev,
                        {
                          title: '',
                          description: '',
                          choices: [{ title: '', value: 0 }]
                        }
                      ])
                    }
                  >
                    <PlusIcon size="1rem" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {formStep === 3 && (
            <div className="mb-4">
              <div className="mb-4 px-4 py-2 border border-primary rounded-lg text-primary bg-primary/10 text-center">
                {realContributors.length} contributors are eligible to cast a
                vote
              </div>
              <div className="flex flex-col">
                <label className="text-small ml-2 mb-1 text-grey-lighter">
                  Restrict by Verifiable Credentials
                </label>
                <div
                  className={`flex flex-wrap gap-y-2 gap-x-1.5 p-2 justify-center border border-blue-light bg-blue-input rounded-lg ${
                    isVerifying && 'animate-pulse pointer-events-none'
                  }`}
                >
                  {gitcoinProviders.map((provider) => (
                    <button
                      key={provider.name}
                      className={`btn btn-pill border select-none font-body ${
                        vcs.includes(provider.name)
                          ? 'bg-blue-medium border-blue-medium text-white'
                          : 'bg-transparent border-blue-lightest text-blue-lightest'
                      }`}
                      onClick={() => {
                        if (vcs.includes(provider.name)) {
                          setVcs((prev) =>
                            prev.filter((p) => p !== provider.name)
                          )
                        } else {
                          setVcs((prev) => [...prev, provider.name])
                        }
                      }}
                    >
                      {provider.description}
                    </button>
                  ))}
                </div>
                {vcs.length > 0 && (
                  <div className="flex items-center justify-center gap-4 p-2">
                    <button
                      type="button"
                      className="btn btn-pill bg-red text-white"
                      onClick={() => {
                        setVcs([])
                        setUseVerified(false)
                      }}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn btn-pill bg-blue-medium text-white"
                      disabled={isVerifying}
                      onClick={() => verifyContributors()}
                    >
                      Apply VCs
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {formStep === 4 && (
            <div className="mb-4">
              <div className="mb-4 px-4 py-2 border border-primary rounded-lg text-primary bg-primary/10 text-center">
                {realContributors.length} contributors will be eligible to cast
                a vote
              </div>
              <h1 className="font-title text-large mb-1">{title}</h1>
              {description && <p className="mb-4">{description}</p>}
              <h2 className="font-title text-medium mt-4 mb-2">Questions:</h2>
              {questions.map((question, i) => (
                <div
                  key={i}
                  className="mb-4 px-4 py-2 border border-muted rounded-lg"
                >
                  <h3 className="font-title text-medium mb-1">
                    {question.title}
                  </h3>
                  {question.description && (
                    <p className="mb-4">{question.description}</p>
                  )}
                  <div className="flex flex-col gap-2 mb-2">
                    {question.choices.map((choice, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between px-4 py-2 rounded-lg border border-muted"
                      >
                        <div className="grow">{choice.title}</div>
                        <div className="shrink-0 w-10 text-right">0%</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center">
            {formStep > 1 && (
              <button
                type="button"
                className="btn btn-pill large bg-blue-lightest gap-1"
                onClick={() => setFormStep((prev) => prev - 1)}
                disabled={isSubmitting}
              >
                <ArrowLeftIcon size="1rem" />
                <span>Back</span>
              </button>
            )}

            {formStep < 4 ? (
              <button
                type="button"
                className="btn btn-pill large bg-primary gap-1 ml-auto"
                disabled={isDisabled || isVerifying}
                onClick={() => setFormStep((prev) => prev + 1)}
              >
                <span>Continue</span>
                <ArrowRightIcon size="1rem" />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-pill large bg-primary ml-auto"
                disabled={isDisabled || isSubmitting}
                onClick={() => setShowConfirmationDialog(true)}
              >
                Create Election
              </button>
            )}
          </div>
        </div>
      </Dialog>
      <AlertDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        title="Create this election?"
        description="Once you create an election, you will not be able to edit it."
        confirmText="Create Election"
        onConfirm={() => createElection()}
      />
    </>
  )
}

export default ElectionDialog
