const { addonBuilder, serveHTTP } = require('stremio-addon-sdk')
const RutrackerStreamProviderService = require('./services/RutrackerStreamProviderService')

const rutrackerStreamProviderService = new RutrackerStreamProviderService()

/* eslint new-cap: "off" -- There is a base dependency for our addon. Unfrotunately their code style is different. */
const builder = new addonBuilder({
  id: 'io.strem.rutracker.addon',
  version: '0.0.1',

  name: 'Rutracker addon',

  // Properties that determine when Stremio picks this addon
  // this means your addon will be used for streams of the type movie
  catalogs: [],
  resources: ['stream'],
  types: ['movie'],
  idPrefixes: ['tt']

})

// TODO: test, CI/CD
builder.defineStreamHandler(function (args) {
  if (args.type === 'movie') {
    return rutrackerStreamProviderService.getStreamsById(args.id).then(res => { return { streams: res } })
  }

  return Promise.resolve({ streams: [] })
})

serveHTTP(builder.getInterface(), 8081)
