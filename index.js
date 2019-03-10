const config = require('./config.json')
const getRulesDef = require('./get-rules-definition.json')
const QRSInteract = require('qrs-interact')

const qrs = new QRSInteract(config)

qrs.Post('systemrule/table?filter=((category+eq+%27Security%27))&orderAscending=true&skip=0&sortColumn=name', getRulesDef, 'json')
  .then((result) => {
    console.log(result)
    const items = result.body.rows.map((objectID) => ({
      objectID,
      type: 'SystemRule'
    }))

    qrs
      .Post('selection', { items }, 'json')
      .then((result) => {
        const selectionId = result.body.id

        qrs
          .Get(`selection/${selectionId}/systemrule/full`)
          .then((result) => {
            const rules = result.body

            qrs
              .Delete(`selection/${selectionId}`)
              .then(() => {
                console.log(rules)
              })
          })
      })
  })
