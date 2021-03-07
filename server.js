import express from 'express'
import fetch from 'node-fetch'
import cookieSession from 'cookie-session'

const app = express()

const github = {
  client_id: process.env.GITHUB_CLIENT_ID,
  client_secret: process.env.GITHUB_CLIENT_SECRET
}
// console.log(github)

const cookie_secret = process.env.COOKIE_SECRET

app.use(cookieSession({
  secret: cookie_secret
}))

app.get('/', (req, res) => {
  res.send('OAuth 3')
})

app.get('/login/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${github.client_id}&redirect_uri=https://oauth3.jademaveric.repl.co/login/github/callback`
  res.redirect(url)
})

async function getAccessToken (client_id, client_secret, code) {
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
  console.log("Sent POST request")
  const data = await res.text()
  console.log("Got response " + data)
  const params = new URLSearchParams(data)
  return params.get('access_token')
}

async function getGithubUser (access_token) {
  const req = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `bearer ${access_token}`
    }
  })
  const data = await req.json()
  return data
}

app.get('/login/github/callback', async (req, res) => {
  const code = req.query.code
  const token = await getAccessToken(github.client_id, github.client_secret, code)
  const githubData = await getGithubUser(token)
  
  if(githubData) {
    req.session.githubId = githubData.id
    req.session.token = token
    res.redirect('/admin')
  } else {
    console.log("Error: No githubData found")
    res.send("Error: No githubData found")
  }
})

app.get('/admin', (req, res) => {
  if(req.session.githubId === 12978899) {
    res.send('Hello Julius <pre>' + JSON.stringify(req.session) + '</pre>')
  } else {
    res.send('Not authorized <pre>' + JSON.stringify(req.session) + '</pre>, <a href="/login/github">login</a>')
  }
})

app.get('/logout', (req, res) => {
  req.session = null
  res.redirect('/')
})

const PORT = process.env.PORT || 9000
app.listen(PORT, () => console.log('Listening https://oauth3.jademaveric.repl.co:'+PORT))
