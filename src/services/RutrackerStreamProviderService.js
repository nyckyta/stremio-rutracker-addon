const RutrackerApi = require('rutracker-api')
const TorrentMetaInfo = require('../data/TorrentMetaInfo')
const axios = require('axios').default

const rutrackerUsername = process.env.RUTRACKER_USERNAME || 'username'
const rutrackerPassword = process.env.RUTRACKER_PASSWORD || 'password'

// list of appropriate categories for tracks.
// It's required because tracks also could distribute music, images or whatever, but we need only films and series.
const validCategories = [
  'Фильмы до 1990 года',
  'Фильмы 1991-2000',
  'Фильмы 2001-2005',
  'Фильмы 2006-2010',
  'Фильмы 2011-2015',
  'Фильмы 2016-2019',
  'Фильмы 2020',
  'Фильмы Ближнего Зарубежья',
  'Азиатские фильмы',
  'Индийское кино',
  'Короткий метр',
  'Грайндхаус',
  'Классика мирового кинематографа (HD Video)',
  'Классика мирового кинематографа',
  'Фильмы HD для Apple TV',
  'Видео для смартфонов и КПК',
  'Фильмы для iPod, iPhone, iPad'
]

class RutrackerStreamProviderService {
  constructor () {
    this.host = 'https://v3-cinemeta.strem.io'
    this.api = new RutrackerApi()
  }

  // TODO: refactore, error processing, logging!!!
  getStreamsById (id) {
    return axios.get(`${this.host}/meta/movie/${id}.json`)
      .then(body => this.api.login({ username: rutrackerUsername, password: rutrackerPassword })
        .then(() => this.api.search({ query: `${body.data.meta.name} ${body.data.meta.year}` }) // search by name and year of the film
          .then(torrents => this.mapValidTorrentsToStreams(torrents))
        )
      )
  }

  // TODO: layout issues regarding title
  mapValidTorrentsToStreams (torrents) {
    const metaInfoOfValidTorrents = this.mapValidTorrentsToMetaInfo(torrents)
    return Promise.all(metaInfoOfValidTorrents.map(info => this.api.getMagnetLink(info.id)
      .then(magnetLink => this.retrieveTorrentInfoHash(magnetLink))
      .then(infoHash => { return { infoHash: infoHash, title: info.title } })
    ))
  }

  /** In this case the torrents parameter is a list of "Torrent" i.e. list of rutracker-api entity.
   *  It maps API entity to simple object that contains title, category and ID of the rutracker torrent API entity.
        See https://github.com/nikityy/rutracker-api/blob/master/lib/torrent.js */
  mapValidTorrentsToMetaInfo (torrents) {
    return torrents.filter(torrent => this.isTorrentValid(torrent)).map(torrent => {
      return new TorrentMetaInfo(torrent.id, torrent.title, torrent.category)
    })
  }

  /** torrent is valid only if his chekced state and torrent's category in list of valid categories */
  isTorrentValid (torrent) {
    return torrent.state === 'проверено' && validCategories.includes(torrent.category)
  }

  /** ids - list of tracks id from rutracker */
  retrieveTorrentInfoHashByRutrackerIds (ids) {
    return Promise.all(ids.map(trackId => this.api.getMagnetLink(trackId)
      .then(magnetLink => this.retrieveTorrentInfoHash(magnetLink))
    ))
  }

  retrieveTorrentInfoHash (magnetLink) {
    // it also converts characters to lower case , because it does not work with upper case.
    // TODO: figure out why it does not work with upper case
    return magnetLink.substring(20, 60).toLowerCase()
  }
}

module.exports = RutrackerStreamProviderService
