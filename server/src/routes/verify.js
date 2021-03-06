import express from 'express';
import fetch from 'snekfetch';

import { discordTokens, authorized, tokens } from '../util/cacheDB'

const router = express.Router()

function createToken() {
    const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let token = ""
    for(let i=0;i<32;i++) {
        token += base64.charAt(Math.floor(Math.random()*base64.length))
    }
    return token
}

function askDiscord(token) {
    console.log("Discord asked")
    return fetch.get("https://discordapp.com/api/v6/users/@me")
        .set("Authorization", `Bearer ${token}`)
        .send()
        .then(response => {
            if(!response.ok) {
                return 1
            }
            discordTokens.set(token, response.body.id)
            return response.body.id
        })
}

router.post("/", async (req, res) => {
    console.log("Request")
    const { credentials } = req.body;
    if(!authorized.includes(credentials.id))
        return res.status(403).json({user : {valid: false, token: "CHUJ"}, error: "Not Autorized"})
    
    console.log(credentials)

    let validID = false;

    if(discordTokens.has(credentials.token)) 
        validID = discordTokens.get(credentials.token)
    else
        validID = await askDiscord(credentials.token)

    if(validID !== credentials.id) 
        return res.status(403).json({user: { valid: false, token: "NOPE"}, error: "Invalid credentials"})

    let returnToken = createToken()
    if(tokens.has(validID)) {
        returnToken = tokens.get(validID)
    } else {
        tokens.set(validID,returnToken)
    }
    console.log(validID, returnToken)
    return res.status(200).json({user: {valid: true, token: returnToken}})
})

export default router