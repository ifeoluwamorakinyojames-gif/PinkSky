import {createClient} from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined
const dataset = (import.meta.env.VITE_SANITY_DATASET as string | undefined) || 'production'

export const sanityEnabled = Boolean(projectId)

export const sanityClient = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2026-10-03',
      useCdn: true,
    })
  : null

export const sanityFreshClient = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2026-10-03',
      useCdn: false,
    })
  : null
