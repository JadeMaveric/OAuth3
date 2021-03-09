import express from 'express'
import github from './github.js'
import twitter from './twitter.js'

const login = express.Router()

login.get('/', (req, res) => {
  res.send('\
  <a href="/login/github">Github</a><br>\
  <a href="/login/twitter">Twitter</a>')
})

login.use('/github', github)
login.use('/twitter', twitter)

export default login
