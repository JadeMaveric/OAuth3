import express from 'express'
import fetch from 'node-fetch'
import cookieSession from 'cookie-session'
import login from './login.js'

const app = express()

const cookie_secret = process.env.COOKIE_SECRET

app.use(cookieSession({
  secret: cookie_secret
}))

app.get('/', (req, res) => {
  if(req.session.length) {
    res.send('Hello! <pre>' + JSON.stringify(req.session) + '</pre><a href="/logout">Logout</a><br>\
    <a href="/terms-of-service">Terms of Service</a> \
    <a href="privacy-policy">Privacy Policy</a>')
  } else {
    res.send('OAuth 3<br/>Please <a href="/login">login</a><br>\
    <a href="/terms-of-service">Terms of Service</a> \
    <a href="privacy-policy">Privacy Policy</a>')
  }
})

app.use('/login', login)

app.get('/logout', (req, res) => {
  req.session = null
  res.redirect('/')
})

app.get('/terms-of-service', (req, res) => {
  res.send("This app is only intended to showcase how Auth would work with Node and Express. This program comes with ABSOLUTELY NO WARRANTY")
})

app.get('/privacy-policy', (req, res) => {
  res.send("This app is not designed to store any data on the backend. All user information is comminucated with the backed via session tokens. These are deleted when the session is closeed or the user logs out. Information is retrieved for the sole purpose of displaying it back to the user.")
})

const PORT = process.env.PORT || 9000
app.listen(PORT, () => console.log('Listening https://oauth3.jademaveric.repl.co:'+PORT))
