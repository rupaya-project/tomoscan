const api = require('./api')
const Web3Connector = require('./services/Web3Connector')
const authService = require('./services/Auth')

const express = require('express')
const events = require('events')
const morgan = require('morgan')
const compression = require('compression')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const config = require('config')
const fs = require('fs')
const yaml = require('js-yaml')
const swaggerUi = require('swagger-ui-express')
// const ipFilter = require('express-ipfilter').IpFilter

const app = express()

// fix warning max listener
events.EventEmitter.defaultMaxListeners = 1000
process.setMaxListeners(1000)

// Init socket.io.
const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.set('port', config.get('PORT') || 3333)
app.use(compression())
app.use(morgan('short'))
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// const whitelistIp = require('../config/whitelist-ip.json')

// const customDetection = req => {
//     console.log('kaka', req.header('x-forwarded-for'))
//     return req.header('x-forwarded-for') ? req.header('x-forwarded-for').split(',')[0] : ''
// }
// app.use(ipFilter(whitelistIp, { mode: 'allow', detectIp: customDetection }))

const docs = yaml.safeLoad(fs.readFileSync('./src/docs/swagger.yml', 'utf8'))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(docs))

// Init auth and jwt.
app.use(authService.initialize())
authService.setJwtStrategy()

mongoose.connect(config.get('MONGODB_URI'),
    { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
        if (err) {
            console.log(
                'MongoDB Connection Error. Please make sure that MongoDB is running.')
            process.exit(1)
        } else {
            // Initialize public api
            app.use('/api', api)
        }
    })

if (config.get('DEBUG_QUERY') === true) {
    mongoose.set('debug', function (coll, method, query, doc, options) {
        const set = {
            coll: coll,
            method: method,
            query: query,
            doc: doc,
            options: options
        }

        console.log({
            dbQuery: set
        })
    })
}

server.listen(app.get('port'), async () => {
    try {
        console.log('Start ws for web3.')
        Web3Connector.connect(io)

        console.log('Express server listening on port ' + app.get('port'))
    } catch (e) {
        console.trace(e)
        return null
    }
})

module.exports = app
