import express from 'express'
import fetch from 'node-fetch'
import cookieSession from 'cookie-session'
import login from './login'

const app = express()

const cookie_secret = process.env.COOKIE_SECRET

app.use(cookieSession({
  secret: cookie_secret
}))

app.get('/', (req, res) => {
  res.send('OAuth 3<br/>Please <a href="/login">login</a>')
})

app.get('/admin', (req, res) => {
  if(req.session.email === 'juliusalphonso.09@gmail.com') {
    res.send('Hello Julius <pre>' + JSON.stringify(req.session) + '</pre><a href="/logout">Logout</a>')
  } else {
    req.session = null
    res.send('Not authorized <pre>' + JSON.stringify(req.session) + '</pre><a href="/login">Login</a>')
  }
})

app.use('/login', login)

app.get('/logout', (req, res) => {
  req.session = null
  res.redirect('/')
})

const PORT = process.env.PORT || 9000
app.listen(PORT, () => console.log('Listening https://oauth3.jademaveric.repl.co:'+PORT))
