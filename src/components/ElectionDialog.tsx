import { useState, useEffect, useMemo } from 'react'
import { PlainCensus, Election } from '@vocdoni/sdk'
import {
  HiOutlineX as CloseIcon,
  HiPlus as PlusIcon,
  HiTrash as TrashIcon,
  HiArrowSmLeft as ArrowLeftIcon,
  HiArrowSmRight as ArrowRightIcon
} from 'react-icons/hi'
import { useContributors } from '../hooks/useSubtopic'
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
  onCreated: (election: Election) => Promise<void>
}) => {
  const { data: census } = useContributors(subtopic)
  const [formStep, setFormStep] = useState<number>(1)
  const [type, setType] = useState<string>('basic')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [header, setHeader] = useState<string>('')
  const [streamUri, setStreamUri] = useState<string>('')
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

  const isDisabled = useMemo(() => {
    if (formStep === 1 && (!type || !title || !days)) {
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

    return false
  }, [formStep, type, title, description, days, questions])

  const createElection = async (census: PlainCensus) => {
    if (isDisabled || isSubmitting) return

    setIsSubmitting(true)

    const election = Election.from({
      title,
      description,
      header,
      streamUri,
      endDate: new Date().getTime() + days * 24 * 60 * 60,
      census
    })

    for (const question of questions) {
      election.addQuestion(
        question.title,
        question.description,
        question.choices
      )
    }

    setIsSubmitting(false)
  }

  useEffect(() => {
    if (formStep === 3) {
      // Remove empty questions
      const filteredQuestions = questions.filter((q) => q.title)

      // Remove empty choices
      const filteredChoices = filteredQuestions.map((q) => {
        return q.choices.filter((c) => c.title)
      })

      // Update questions
      setQuestions(
        filteredQuestions.map((q, i) => {
          return {
            ...q,
            choices: filteredChoices[i]
          }
        })
      )
    }
  }, [formStep, questions])

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <div className="w-[735px] max-w-full p-6">
          {formStep === 1 && (
            <>
              <header className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-large font-title">Election Details</h2>
                <button
                  type="button"
                  className="btn btn-circle bg-blue-medium"
                  onClick={() => setShowDialog(false)}
                >
                  <CloseIcon size="1.25rem" />
                </button>
              </header>

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
                  >
                    <option value="basic">Basic</option>
                    <option value="stream">Ranked</option>
                  </select>
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
            </>
          )}

          {formStep === 2 && (
            <>
              <header className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-large font-title">Define Questions</h2>
                <button
                  type="button"
                  className="btn btn-circle bg-blue-medium"
                  onClick={() => setShowDialog(false)}
                >
                  <CloseIcon size="1.25rem" />
                </button>
              </header>

              <div className="mb-4">
                <label className="inline-block text-small ml-2 mb-1 text-grey-lighter">
                  Questions <span className="text-red">*</span>
                </label>
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
            </>
          )}

          {formStep === 3 && (
            <>
              <header className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-large font-title">Preview Election</h2>
                <button
                  type="button"
                  className="btn btn-circle bg-blue-medium"
                  onClick={() => setShowDialog(false)}
                >
                  <CloseIcon size="1.25rem" />
                </button>
              </header>

              <div className="mb-4">
                <h1 className="font-title text-large mb-2">{title}</h1>
                {description && <p className="mb-2">{description}</p>}
                <h2 className="font-title text-medium mt-4 mb-2">Questions:</h2>
                {questions.map((question, i) => (
                  <div key={i} className="mb-4">
                    <h3 className="font-title text-medium mb-2">
                      {question.title}
                    </h3>
                    {question.description && (
                      <p className="mb-3">{question.description}</p>
                    )}
                    <div className="flex flex-col gap-2 mb-4">
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

              <div className="mb-4">
                <p>Current eligible voters is {census.length} addresses</p>
              </div>
            </>
          )}

          <div className="flex items-center">
            {formStep > 1 && (
              <button
                type="button"
                className="btn btn-pill large bg-blue-lightest gap-1"
                onClick={() => setFormStep((prev) => prev - 1)}
              >
                <ArrowLeftIcon size="1rem" />
                <span>Back</span>
              </button>
            )}

            {formStep === 3 ? (
              <button
                type="button"
                className="btn btn-pill large bg-primary ml-auto"
                disabled={isDisabled || isSubmitting}
                onClick={() => setShowConfirmationDialog(true)}
              >
                Create Election
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-pill large bg-primary gap-1 ml-auto"
                disabled={isDisabled}
                onClick={() => setFormStep((prev) => prev + 1)}
              >
                <span>Continue</span>
                <ArrowRightIcon size="1rem" />
              </button>
            )}
          </div>
        </div>
      </Dialog>
      <AlertDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        title="Create this election?"
        description="Once you create an election, you will not be able to edit it. Only users who have been commented to current subtopic up to this point will be able to vote."
        confirmText="Create Election"
        onConfirm={() => console.log('confirm')}
      />
    </>
  )
}

export default ElectionDialog
