const fs = require('fs')
const request = require('request')
const rs = require('randomstring')
const getRulesDef = require('./get-rules-definition.json')

const generateXRFKey = () => rs.generate({
  length: 16,
  charset: 'alphanumeric'
})

const getParams = (qs) => {
  const xrfKey = generateXRFKey()

  return {
    headers: {
      'X-Qlik-Xrfkey': xrfKey,
      userid: process.env.USERID
    },
    qs: {
      ...qs,
      xrfKey
    }
  }
}

const r = request.defaults({
  ...getParams(),
  baseUrl: process.env.HOST
})

r.post({
  url: '/systemrule/table',
  qs: {
    filter: `((type eq 'Custom') and (category eq 'Security'))`,
    orderAscending: true,
    skip: 0,
    take: 200,
    sortColumn: 'name'
  },
  json: getRulesDef
}, (error, response, body) => {
  if (error) {
    console.log(error)
    process.exit(1)
  }

  const items = body.rows.map(([ objectID ]) => ({
    objectID,
    type: 'SystemRule'
  }))

  r.post({
    url: '/selection',
    json: { items }
  }, (error, response, body) => {
    if (error) {
      console.log(error)
      process.exit(1)
    }

    const selectionId = body.id

    r.get(`/selection/${selectionId}/systemrule/full`, (error, response, body) => {
      if (error) {
        console.log(error)
        process.exit(1)
      }

      const rules = body

      r.delete(`/selection/${selectionId}`, () => fs.writeFileSync('rules.json', rules))
    })
  })
})
