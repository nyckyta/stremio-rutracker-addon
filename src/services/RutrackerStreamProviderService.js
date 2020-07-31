const RutrackerApi = require("rutracker-api");

const axios = require("axios").default

const rutrackerUsername = process.env.RUTRACKER_USERNAME || "username"
const rutrackerPassword = process.env.RUTRACKER_PASSWORD || "password"

//list of appropriate categories for tracks. 
//It's required because tracks also could distribute music, images or whatever, but we need only films and series. 
const validCategories = [
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
    "Грайндхаус",
    "Классика мирового кинематографа (HD Video)",
    "Классика мирового кинематографа",
    "Фильмы HD для Apple TV",
    "Видео для смартфонов и КПК",
    "Фильмы для iPod, iPhone, iPad"
]

class RutrackerStreamProviderService {

    constructor() {
        this.host = "https://v3-cinemeta.strem.io"
        this.api = new RutrackerApi()
    }

    //TODO: refactore, error processing, logging!!!
    getStreamsById(id) {
        return axios.get(`${this.host}/meta/movie/${id}.json`)
            .then(body => this.api.login({username: rutrackerUsername, password: rutrackerPassword})
                .then(() => this.api.search({query: `${body.data.meta.name} ${body.data.meta.releaseInfo}`})
                    .then(torrents => this.mapValidTorrentsToTheirRutrackerId(torrents))
                    .then(torrentsIds => this.retrieveMagnetLinksByIds(torrentsIds))
                )
                .then(magnetLinks => magnetLinks.map(magnetLink => {return {infoHash: magnetLink}}))
            )   
    }

    /**In this case torrents is list of "Torrent" i.e. list of rutracker-api entity. 
        See https://github.com/nikityy/rutracker-api/blob/master/lib/torrent.js */
    mapValidTorrentsToTheirRutrackerId(torrents) {
        return torrents.filter(torrent => this.isTorrentValid(torrent)).map(torrent => torrent.id)
    }

    /**torrent is valid only if his chekced state and torrent's category in list of valid categories */
    isTorrentValid(torrent) {
        return torrent.state === "проверено" && validCategories.includes(torrent.category)
    }
    
    /** ids - list of tracks id from rutracker */
    retrieveMagnetLinksByIds(ids) {
        return Promise.all(ids.map(trackId => this.api.getMagnetLink(trackId)
            .then(magnetLink => this.retrieveTorrentInfoHash(magnetLink))
        ))
    }

    retrieveTorrentInfoHash(magnetLink) {
        //it also converts characters to lower case , because it does not work with upper case. 
        //TODO: figure out why it does not work with upper case
        return magnetLink.substring(20, 60).toLowerCase()  
    }

}

module.exports = RutrackerStreamProviderService