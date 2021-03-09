import express from 'express'
import fetch from 'node-fetch'
import crypto from 'crypto'

const twitter = express.Router()

const consumer_key = process.env.TWITTER_CONSUMER_KEY
const consumer_secret = process.env.TWITTER_CONSUMER_SECRET
const bearer_token = process.env.TWITTER_BEARER_TOKEN
const access_token = process.env.TWITTER_ACCESS_TOKEN
const access_token_secret = process.env.TWITTER_ACCESS_TOKEN_SECRET
console.log("Twitter", {consumer_key, consumer_secret, bearer_token, access_token, access_token_secret})

// For compliance with RFC 3986 (which reserves !, ', (, ), and *)
function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

function collectParameters(params) {
  // 1. Percent encode every key and value that will be signed.
  var new_params = {}
  for (let key in params) {
    let new_key = fixedEncodeURIComponent(key)
    let new_value = fixedEncodeURIComponent(params[key])
    new_params[new_key] = new_value
  }
  
  // 2. Sort the list of parameters alphabetically by encoded key .
  new_params = Object.keys(new_params).sort().reduce(
    (result, key) => {
      result[key] = new_params[key];
      return result;
    }, {}
  )

  // 3. For each key/value pair:
  let param_string = ""
  for (let key in new_params) {
    // 3.1 Append the encoded key to the output string.
    param_string += key
    // 3.2 Append the ‘=’ character to the output string.
    param_string += '='
    // 3.3 Append the encoded value to the output string.
    param_string += new_params[key]
    // 3.4 If there are more key/value pairs remaining, append a ‘&’ character to the output string.
    param_string += '&'
  }
  param_string = param_string.slice(0,-1) // Remove the last '&'
  // console.log("Parameter String", param_string)
  return param_string
}

function createSignatureBaseString(param_string, method, url) {
  // 4. Creating the signature base string
  let base_string = ''
  // 4.1 Convert the HTTP Method to uppercase and add to base_string
  base_string += method.toUpperCase()
  // 4.2 Append the ‘&’ character to the output string.
  base_string += '&'
  // 4.3 Percent encode the URL and append it to the output string.
  base_string += fixedEncodeURIComponent(url)
  // 4.4 Append the ‘&’ character to the output string.
  base_string += '&'
  // 4.5 Percent encode the parameter string and append it to the output string.
  base_string += fixedEncodeURIComponent(param_string)
  // console.log("Signature Base String", base_string)
  return base_string
}

function getSigningKey(con_secret, tok_secret) {
  let signing_key = fixedEncodeURIComponent(con_secret) + '&'
  if( tok_secret)
    signing_key += fixedEncodeURIComponent(tok_secret)
  // console.log(signing_key)
  return signing_key
}

function calculateSignature(base_string, signing_key) {
  let oauth_sign = crypto
  .createHmac('sha1', signing_key)
  .update(base_string)
  .digest('base64')
  // console.log(oauth_sign)
  return oauth_sign
}

function makeAuthSign(params, method, url, con_secret, tok_secret) {
  console.log("Creating_Auth_Signature_for_Twitter")

  /* Steps from https://developer.twitter.com/en/docs/authentication/oauth-1-0a/creating-a-signature */
  
  // Collecting Paramters
  const param_string = collectParameters(params)

  // Creating the signature base string
  const base_string = createSignatureBaseString(param_string, method, url)

  // 5. Getting a signing key
  const signing_key = getSigningKey(con_secret, tok_secret)

  // 6. Calculate the signature
  const oauth_sign = calculateSignature(base_string, signing_key)

  return oauth_sign
}

function buildAuthHeader(params) {
  // OAuth requires parameters to be sorted
  params = Object.keys(params).sort().reduce(
    (result, key) => {
      result[key] = params[key];
      return result;
    }, {}
  )

  let dst = ""
  // 1. Append the string “OAuth ” (including the space at the end) to DST.
  dst += "OAuth "
  // 2. For each key/value pair of the 7 parameters listed above:
  for (let key in params) {
    // 2.1 Percent encode the key and append it to DST.
    dst += fixedEncodeURIComponent(key)
    // 2.2 Append the equals character ‘=’ to DST.
    dst += "="
    // 2.3 Append a double quote ‘”’ to DST.
    dst += '"'
    // 2.4 Percent encode the value and append it to DST.
    dst += fixedEncodeURIComponent(params[key])
    // 2.5 Append a double quote ‘”’ to DST.
    dst += '"'
    // 2.6 If there are key/value pairs remaining, append a ', ' to DST.
    dst += ', '
  }
  // Remove the trailing ', ' from dst
  dst = dst.slice(0, -2)
  // console.log(dst)
  return dst
}

async function getRequestToken() {
  const method = "POST"
  const endpoint_url = "https://api.twitter.com/oauth/request_token"
  const callback_url = 'https://oauth3.jademaveric.repl.co/login/twitter/callback'
  const params = {
    'oauth_callback': callback_url,
    'oauth_consumer_key': consumer_key,
    'oauth_nonce': Math.random().toString(16).slice(2),
    'oauth_signature_method': 'HMAC-SHA1',
    'oauth_timestamp': Date.now()/1000 | 0,
    'oauth_version': '1.0'
  }
  params.oauth_signature = makeAuthSign(params, method, endpoint_url, consumer_secret)

  // console.log(params)

  const header = {
      'Authorization': buildAuthHeader(params)
  }
  // console.log(header)

  const res = await fetch('https://api.twitter.com/oauth/request_token', {
    method: 'POST',
    headers: header
  })

  const data = await res.text()
  console.log("Got response from twitter /oauth/request_token", data)

  const res_params = new URLSearchParams(data)
  if (res_params.get('oauth_callback_confirmed') === 'true') {
    console.log(res_params)
    return {
      'oauth_token': res_params.get('oauth_token'),
      'oauth_token_secret': res_params.get('oauth_token_secret'),
      'oauth_callback_confirmed': true
    }
  }
  else {
    console.log("Error: OAuth Callback Confirmed is false")
    return {'oauth_callback_confirmed': false, 'error': data}
  }
}

twitter.get('/', async (req, res) => {
  console.log("Logging into twitter")
  const {oauth_token, oauth_token_secret, oauth_callback_confirmed, error} = await getRequestToken()

  req.session.oauth_token = oauth_token
  if (oauth_callback_confirmed === false) {
    res.send(error)
    console.log('There was an error')
  } else {
    console.log("Got Request token, redirecting user to twitter")
    const url = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`
    res.redirect(url)
  }
})

async function getAccessToken (oauth_token, oauth_verifier) {
  console.log("Requsting Access Token")
  const method = 'POST'
  const url = `https://api.twitter.com/oauth/access_token`
  const params = {
    'oauth_consumer_key': consumer_key,
    'oauth_nonce': Math.random().toString(16).slice(2),
    'oauth_signature_method': 'HMAC-SHA1',
    'oauth_timestamp': Date.now()/1000 | 0,
    'oauth_token': oauth_token,
    'oauth_version': '1.0'
  }
  params.oauth_signature = makeAuthSign(params, method, url, consumer_secret)
  console.log(params)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': buildAuthHeader(params),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `oauth_verifier=${oauth_verifier}`
  })

  const data = await res.text()
  // console.log(data)

  const res_params = new URLSearchParams(data)
  // console.log(res_params)
  return {
    'user_token': res_params.get('oauth_token'),
    'user_token_secret': res_params.get('oauth_token_secret'),
    'user_id': res_params.get('user_id'),
    'screen_name': res_params.get('screen_name')
  }
}

async function getTwitterUser(user_token, user_secret, user_id, screen_name) {
  const method = 'GET'
  const url = 'https://api.twitter.com/1.1/account/verify_credentials.json'
  
  const params = {
    'oauth_consumer_key': consumer_key,
    'oauth_nonce': Math.random().toString(16).slice(2),
    'oauth_signature_method': 'HMAC-SHA1',
    'oauth_timestamp': Date.now()/1000 | 0,
    'oauth_token': user_token,
    'oauth_version': '1.0'
  }
  params.oauth_signature = makeAuthSign(params, method, url, consumer_secret, user_secret)
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': buildAuthHeader(params)
    }
  })

  const data = await res.json()
  console.log(data)

  return data
}

twitter.get('/callback', async (req, res) => {
  console.log("Got /callback from twitter")
  const oauth_token = req.query.oauth_token
  const oauth_verifier = req.query.oauth_verifier

  if (oauth_token == req.session.oauth_token) {
    const {user_token, user_token_secret, user_id, screen_name} = await getAccessToken(oauth_token, oauth_verifier)
    const twitterData = await getTwitterUser(user_token, user_token_secret, user_id, screen_name)

    if (twitterData) {
      req.session.provider = 'twitter'
      req.session.id = twitterData.id
      req.session.token = user_token
      req.session.secret = user_token_secret
      req.session.avatar_url = twitterData.profile_image_url_https
      req.session.name = twitterData.name
      req.session.email = undefined
      res.redirect('/')
    }

  } else {
    req.session = null
    res.send("Authentication error, token did not match<br>\
    <a href='/'>Home</a>")
  }

})

export default twitter
export {makeAuthSign, collectParameters, createSignatureBaseString, getSigningKey, calculateSignature, buildAuthHeader}
