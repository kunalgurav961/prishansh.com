import { createHash } from 'node:crypto'

const hashToken = (token) => createHash('sha256').update(token).digest('hex')

export default hashToken
