import express from 'express'
import fetch from 'node-fetch'

const github = express.Router()

const client_id = process.env.GITHUB_CLIENT_ID
const client_secret = process.env.GITHUB_CLIENT_SECRET
console.log("Github", {client_id, client_secret})

github.get('/', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=https://oauth3.jademaveric.repl.co/login/github/callback`
  res.redirect(url)
})

async function getGithubUser (access_token) {
  const req = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `bearer ${access_token}`
    }
  })
  const data = await req.json()
  return data
}

export async function getAccessToken (client_id, client_secret, code) {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id,
      client_secret,
      code
    })
  })
  const data = await res.text()
  const params = new URLSearchParams(data)
  return params.get('access_token')
}

github.get('/callback', async (req, res) => {
  const code = req.query.code
  const token = await getAccessToken(client_id, client_secret, code)
  const githubData = await getGithubUser(token)

  if(githubData) {
    req.session.service = 'github'
    req.session.id = githubData.id
    req.session.token = token
    req.session.avatar_url = githubData.avatar_url
    req.session.name = githubData.name
    req.session.email = githubData.email
    res.redirect('/admin')
  } else {
    console.log("Error: No githubData found")
    res.send("Error: No githubData found")
  }
})

export default github