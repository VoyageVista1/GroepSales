export const VOYAGE_CATALOG_TAG = 'voyage-trips'

export async function invalidateVoyageCatalog<T>({ doc }: { doc: T }): Promise<T> {
  const { revalidateTag } = await import('next/cache')
  // Published changes and upload replacements must be read on the next request.
  revalidateTag(VOYAGE_CATALOG_TAG, { expire: 0 })
  return doc
}
