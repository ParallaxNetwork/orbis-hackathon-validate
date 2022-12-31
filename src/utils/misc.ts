import { NFTStorage } from 'nft.storage'

export const appendToFilename = (filename: string, string: string) => {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex == -1) return filename + string
  else
    return (
      filename.substring(0, dotIndex) + string + filename.substring(dotIndex)
    )
}

/**
 *
 * @param items An array of items.
 * @param fn A function that accepts an item from the array and returns a promise.
 * @returns {Promise}
 */
export const forEachPromise = (
  items: any[],
  fn: (item: any) => void | Promise<void>
): Promise<any> => {
  return items.reduce(function (promise, item) {
    return promise.then(function () {
      return fn(item)
    })
  }, Promise.resolve())
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: any

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(() => resolve(func(...args)), waitFor)
    })
}

export const uploadSingleFileToIpfs = async (file: File) => {
  // Create file blob
  const reader = new FileReader()
  reader.readAsArrayBuffer(file)
  await new Promise((resolve, reject) => {
    reader.onloadend = resolve
    reader.onerror = reject
  })
  const blob = new Blob([reader.result as BlobPart], { type: file.type })

  // Store to IPFS
  const client = new NFTStorage({ token: import.meta.env.VITE_NFT_STORAGE_KEY })
  const cid = await client.storeBlob(blob)
  return cid
}

export const uploadToIpfs = async (data: any) => {
  const client = new NFTStorage({ token: import.meta.env.VITE_NFT_STORAGE_KEY })
  const cid = await client.storeDirectory(data)
  return cid
}
