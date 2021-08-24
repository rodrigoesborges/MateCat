import {getMatecatApiDomain} from '../../utils/getMatecatApiDomain'

export const getJobFileInfo = async (idJob, password) => {
  const response = await fetch(
    `${getMatecatApiDomain()}api/v3/jobs/${idJob}/${password}/files`,
    {
      credentials: 'include',
    },
  )

  if (!response.ok) return Promise.reject(response)

  const {errors, ...data} = await response.json()
  if (errors && errors.length > 0) return Promise.reject(errors)

  return data
}
