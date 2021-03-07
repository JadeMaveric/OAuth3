import express from 'express'
import github from './github'

const login = express.Router()

login.get('/', (req, res) => {
  res.send('<a href="/login/github">Github</a>')
})

login.use('/github', github)

export default login
