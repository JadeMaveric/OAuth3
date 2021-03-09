import crypto from 'crypto'
import assert from 'assert'

import { makeAuthSign, collectParameters, createSignatureBaseString, getSigningKey, calculateSignature, buildAuthHeader } from '../twitter.js'

console.log("Using values from https://developer.twitter.com/en/docs/authentication/oauth-1-0a/creating-a-signature")

const method = 'POST'
const url = 'https://api.twitter.com/1.1/statuses/update.json'
let params = {
  include_entities: "true",
  oauth_consumer_key: "xvz1evFS4wEEPTGEFPHBog",
  oauth_nonce: "kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg",
  oauth_signature_method: "HMAC-SHA1",
  oauth_timestamp: "1318622958",
  oauth_token: "370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb",
  oauth_version: "1.0",
  status: "Hello Ladies + Gentlemen, a signed OAuth request!"
}

console.log("Parameters", params)

const demo_param_string = "include_entities=true&oauth_consumer_key=xvz1evFS4wEEPTGEFPHBog&oauth_nonce=kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1318622958&oauth_token=370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb&oauth_version=1.0&status=Hello%20Ladies%20%2B%20Gentlemen%2C%20a%20signed%20OAuth%20request%21"

const demo_base_string = "POST&https%3A%2F%2Fapi.twitter.com%2F1.1%2Fstatuses%2Fupdate.json&include_entities%3Dtrue%26oauth_consumer_key%3Dxvz1evFS4wEEPTGEFPHBog%26oauth_nonce%3DkYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1318622958%26oauth_token%3D370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb%26oauth_version%3D1.0%26status%3DHello%2520Ladies%2520%252B%2520Gentlemen%252C%2520a%2520signed%2520OAuth%2520request%2521"

const demo_signing_key = "kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw&LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE"

const consumer_secret = "kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw"
const token_secret = "LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE"
const demo_oauth_sign = "hCtSmYh+iHYCEqBWrE7C7hYmtUk="

const demo_oauth_header = 'OAuth oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog", oauth_nonce="kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg", oauth_signature="tnnArxj06cWHq44gCs1OSKk%2FjLY%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1318622958", oauth_token="370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb", oauth_version="1.0"'

describe('Twitter', function() {
  describe('#collectParameters()', function() {
    it('should match the value given in the docs', function() {
      const param_string = collectParameters(params)
      assert.equal(param_string, demo_param_string);
    });
  });
  describe('#createSignatureBaseString()', function() {
    it('should match the value given in the docs', function() {
      const base_string = createSignatureBaseString(demo_param_string, method, url)
      assert.equal(base_string, demo_base_string);
    });
  });
  describe('#getSigningKey()', function() {
    it('should match the value given in the docs', function() {
      const signing_key = getSigningKey(consumer_secret, token_secret)
      assert.equal(signing_key, demo_signing_key);
    });
  });
  describe('#calculateSignature()', function() {
    it('should match the value given in the docs', function() {
      const oauth_sign = calculateSignature(demo_base_string, demo_signing_key)
      assert.equal(oauth_sign, demo_oauth_sign);
    });
  });
  describe('#makeAuthSign()', function() {
    it('should match value give in the docs [compositiong test]', function() {
      const oauth_sign = makeAuthSign(params, method, url, consumer_secret, token_secret)
      assert.equal(oauth_sign, demo_oauth_sign);
    });
  });
  describe('#buildAuthHeader()', function() {
    it('should match value give in the docs', function() {
      delete params.include_entities
      delete params.status
      params.oauth_signature = "tnnArxj06cWHq44gCs1OSKk/jLY="
      const oauth_header = buildAuthHeader(params)
      assert.equal(oauth_header, demo_oauth_header);
    });
  });
});
