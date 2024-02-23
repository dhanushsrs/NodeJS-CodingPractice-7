const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const convertDBObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
// API 1 GET METHOD
app.get('/players/', async (request, response) => {
  const getAllPlayerDetails = `
    SELECT * 
    FROM player_details
    ORDER BY
    player_id`

  const allPlayerDetails = await db.all(getAllPlayerDetails)
  response.send(
    allPlayerDetails.map(eachPlayers => {
      return convertDBObjectToResponseObject(eachPlayers)
    }),
  )
})

// API 2 GET METHOD
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getParticularPlayerDetails = `
    SELECT player_id as playerId,
    player_name as playerName
    FROM player_details
    WHERE
    player_id = ${playerId}`

  const particularPlayer = await db.get(getParticularPlayerDetails)
  response.send(particularPlayer)
})

// API 3 PUT METHOD
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails

  const updatePlayerDetails = `
  UPDATE 
  player_details
  SET
  player_name = '${playerName}'
  WHERE 
  player_id = ${playerId};`

  const updatedPlayer = await db.run(updatePlayerDetails)
  response.send('Player Details Updated')
})

const convertMatchDBObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

// API 4 GET METHOD
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getParticularMatchDetails = `
    SELECT match_id as matchId,
    match,
    year
    FROM match_details
    WHERE
    match_id = ${matchId}`

  const particularMatch = await db.get(getParticularMatchDetails)
  response.send(particularMatch)
})

// API 5 GET METHOD
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
    SELECT *
    FROM player_match_score 
    NATURAL JOIN match_details
    WHERE
    player_id = ${playerId}`

  const playerMatches = await db.all(getPlayerMatchesQuery)

  response.send(
    playerMatches.map(eachMatch => {
      return convertMatchDBObjectToResponseObject(eachMatch)
    }),
  )
})

//API 6 GET METHOD
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayerQuery = `
    SELECT
      player_details.player_id as playerId,
      player_details.player_name as playerName
    FROM player_match_score NATURAL JOIN player_details
    WHERE
    player_match_score.match_id = ${matchId}`

  const matchPlayer = await db.all(getMatchPlayerQuery)

  console.log(matchPlayer)
  response.send(matchPlayer)
})

//API 7 GET METHOD
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getScoreQuery = `
    SELECT
      player_details.player_id as playerId,
      player_details.player_name as playerName,
     SUM(player_match_score.score) as totalScore,
     SUM(fours) as totalFours,
     SUM(sixes) as totalSixes
    FROM 
   player_details INNER JOIN player_match_score
    ON player_details.player_id = player_match_score.player_id
    WHERE
    player_details.player_id = ${playerId}`

  const matchScore = await db.get(getScoreQuery)

  response.send(matchScore)
})

module.exports = app
