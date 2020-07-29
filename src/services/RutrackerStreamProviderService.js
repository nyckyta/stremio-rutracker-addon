const RutrackerApi = require("rutracker-api");

const axios = require("axios").default

const rutrackerUsername = process.env.RUTRACKER_USERNAME || "username";
const rutrackerPassword = process.env.RUTRACKER_PASSWORD || "password";

//list of appropriate categories for tracks. 
//It's required because tracks also could distribute music, images or whatever, but we need only films and series. 
const appropriateCategories = [
    "Фильмы до 1990 года",
    "Фильмы 1991-2000",
    "Фильмы 2001-2005",
    "Фильмы 2006-2010",
    "Фильмы 2011-2015",
    "Фильмы 2016-2019",
    "Фильмы 2020",
    "Фильмы Ближнего Зарубежья",
    "Азиатские фильмы",
    "Индийское кино",
    "Короткий метр",
    "Грайндхаус"
]

class RutrackerStreamProviderService {

    constructor() {
        super();
        this.host = "https://v3-cinemeta.strem.io"
        this.api = new RutrackerApi();
    }

    //TODO: refactore, error processing, logging!!!
    getStreamsById(id) {
        return axios.get(`${this.host}/meta/movie/${id}.json`)
            .then(body => this.api.login({username: rutrackerUsername, password: rutrackerPassword})
                .then(() => this.api.search({query: `${body.meta.name} ${body.meta.releaseInfo}`})
                .then(torrents => torrents.filter(torrent => torrent.state === "проверено")) //ignore any unchecked tracks
                .then(torrents => torrents.filter(torrent => appropriateCategories.includes(torrent.category)))
                .then(torrents => torrents.map(torrent => torrent.id))
                .then(torrentsIds => torrentsIds.map(torrentId => this.api.getMagnetLink(torrentId)
                    .then(magnetLink => this.retrieveTorrentInfoHash(magnetLink))))
                )
            )
        }

    retrieveTorrentInfoHash(magnetLink) {
        return magnetLink.substring(20, 60) //hash-info substring from magnet link 
    }


}

module.exports = RutrackerStreamProviderService;