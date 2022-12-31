import { useState, useEffect, useMemo } from 'react'
import { Vote } from '@vocdoni/sdk'
import { DateTime } from 'luxon'
import { useVocdoni } from '../contexts/vocdoni'
import { useOrbis } from '../contexts/orbis'

import Loading from './Loading'
import { didToAddress } from '../utils/orbis'

enum CensusProofType {
  PUBKEY = 'pubkey',
  ADDRESS = 'address'
}

const Election = ({ electionId }: { electionId: string }) => {
  const { client: vocdoniClient } = useVocdoni()
  const { profile } = useOrbis()
  const [election, setElection] = useState<any>()
  const [selected, setSelected] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [canVote, setCanVote] = useState<boolean>(false)

  const isDisabled = useMemo(() => {
    if (
      !election ||
      !canVote ||
      selected.length < election.metadata.questions.length
    )
      return true

    const { questions } = election.metadata

    return !questions.every(
      (_: any, index: number) =>
        selected[index] === undefined || selected[index] > -1
    )
  }, [election, selected])

  const endTime = useMemo(() => {
    if (!election) return ''
    return DateTime.fromISO(election.endDate).toLocaleString(
      DateTime.DATETIME_MED
    )
  }, [election])

  const fetchElection = async () => {
    if (isLoading) return
    setIsLoading(true)
    const _election = await vocdoniClient?.fetchElection(electionId)
    console.log(_election)
    if (_election) setElection(_election.raw)
    setIsLoading(false)
  }

  const checkEligibility = async () => {
    if (!election || !profile) return

    try {
      await vocdoniClient?.fetchProof(
        election.census.censusRoot,
        didToAddress(profile.did),
        CensusProofType.ADDRESS
      )
      setCanVote(true)
    } catch (error) {
      console.log(error)
      setCanVote(false)
    }
  }

  const calculatePercentage = (q: number, c: number) => {
    if (!election) return 0
    const { result } = election
    const V = parseInt(result[q][c])
    if (V === 0) return 0

    const T = result[q].reduce((acc: number, v: any) => acc + parseInt(v), 0)
    const percentage = (V / T) * 100
    return percentage
  }

  const castVote = async () => {
    if (isSubmitting || !vocdoniClient || !election) return
    setIsSubmitting(true)

    console.log(selected)
    
    try {
      vocdoniClient.setElectionId(election.electionId)
      const vote = new Vote(selected)
      const voteId = await vocdoniClient.submitVote(vote)
      console.log(voteId)
      // Refetch election
      if (voteId) fetchElection()
    } catch (error) {
      console.log(error)
      alert('Error casting vote')
    }

    setIsSubmitting(false)
  }

  useEffect(() => {
    if (electionId && vocdoniClient) fetchElection()
  }, [electionId, vocdoniClient])

  useEffect(() => {
    if (election) {
      console.log(election)
      const _selected = []
      for (let i = 0; i < election.metadata.questions.length; i++) {
        _selected.push(-1)
      }

      if (profile) checkEligibility()
    }
  }, [election, profile])

  return (
    <div className="border border-blue-medium bg-blue-medium/20 rounded-lg p-4">
      {isLoading || !election ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-2">
          {election.metadata.questions.map((question: any, q: number) => (
            <div
              key={q}
              className="border-b border-blue-medium pb-1 last:border-0"
            >
              <h3 className="text-white font-title text-lg mb-1">
                {question.title.default}
              </h3>
              {question.description && (
                <p className="mb-4">{question.description.default}</p>
              )}
              <div className="flex flex-col gap-2 mb-2">
                {question.choices.map((choice: any, c: number) => (
                  <button
                    key={c}
                    className={`flex items-center justify-between px-4 py-2 rounded-lg select-none border ${
                      selected[q] === c
                        ? 'bg-primary border-primary text-blue-dark font-bold'
                        : 'border-blue-medium hover:border-primary hover:text-primary'
                    }`}
                    onClick={() => {
                      if (!canVote) return
                      const _selected = [...selected]
                      _selected[q] = selected[q] === c ? -1 : c
                      setSelected(_selected)
                    }}
                    disabled={!canVote}
                  >
                    <div>{choice.title.default}</div>
                    <div className="shrink-0 w-14 text-right">
                      {calculatePercentage(q, c).toFixed(1)}%
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-2">
            <div className="text-small text-secondary">End Date: {endTime}</div>
            <button
              className={`btn btn-pill ${canVote ? 'bg-primary' : 'bg-red'}`}
              disabled={isDisabled || isSubmitting}
              onClick={castVote}
            >
              {canVote ? 'Cast Vote' : 'Not Eligible'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Election
