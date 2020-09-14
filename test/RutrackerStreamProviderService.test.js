const fs = require('fs/promises')
const axios = require('axios').default
const RutrackerStreamProviderService = require('../src/services/RutrackerStreamProviderService')
const TorrentMetaInfo = require('../src/data/TorrentMetaInfo')
const Stream = require('../src/data/Stream')

const testDataDir = `${__dirname}/data`

jest.mock('axios')

describe('Unit tests are related to RutrackerStreamProviderService', () => {
  describe('Unit tests are related to #retrieveTorrentInfoHash', () => {
    test('Retrieves info hash from magnet link', () => {
      const rutrackerProvider = new RutrackerStreamProviderService()
      const testMagnetLink = 'magnet:?xt=urn:btih:F8597EA4AD8308CEEDCA4D7761DC5B6024DA318D&tr=http%3A%2F%2Fbt.t-ru.org%2Fann%3Fmagnet&dn=torrent_name'
      expect(rutrackerProvider.retrieveTorrentInfoHash(testMagnetLink)).toBe('f8597ea4ad8308ceedca4d7761dc5b6024da318d')
    })
  })

  describe('Unit tests are related to #retrieveTorrentInfoHashByRutrackerIds', () => {
    test('Retieves info hash from tracks ids', () => {
      const rutrackerProvider = new RutrackerStreamProviderService()
      const getMagnetLinkMock = jest.fn((id) => {
        return Promise.resolve(`magnetLink${id}`)
      })
      const retrieveTorrentInfoHashMock = jest.fn()

      rutrackerProvider.api.getMagnetLink = getMagnetLinkMock
      rutrackerProvider.retrieveTorrentInfoHash = retrieveTorrentInfoHashMock

      return rutrackerProvider.retrieveTorrentInfoHashByRutrackerIds(['1', '2', '3']).then((res) => {
        expect(getMagnetLinkMock.mock.calls).toHaveLength(3)
        expect(getMagnetLinkMock.mock.calls[0][0]).toEqual('1')
        expect(getMagnetLinkMock.mock.calls[1][0]).toEqual('2')
        expect(getMagnetLinkMock.mock.calls[2][0]).toEqual('3')

        expect(retrieveTorrentInfoHashMock.mock.calls).toHaveLength(3)
      })
    })
  })

  describe.each([
    [`${testDataDir}/validTorrent.json`, true],
    [`${testDataDir}/invalidTorrent1.json`, false],
    [`${testDataDir}/invalidTorrent2.json`, false],
    [`${testDataDir}/invalidTorrent3.json`, false]
  ])('Unit tests are releated to #isTorrentValid method', (pathToTestData, expectedResult) => {
    test('Returns true if torrent valid and false otherwise', () => {
      const rutrackerProvider = new RutrackerStreamProviderService()

      return fs.readFile(pathToTestData, 'utf-8').then(data => {
        const torrent = JSON.parse(data)
        expect(rutrackerProvider.isTorrentValid(torrent)).toBe(expectedResult)
      })
    })
  })

  describe('Unit tests are related to #mapValidTorrentsToMetaInfo', () => {
    test('Returns list of meta entities for valid torrents', () => {
      const rutrackerProvider = new RutrackerStreamProviderService()

      const isTorrentValidMock = jest
        .fn()
        .mockImplementationOnce(torrent => true)
        .mockImplementationOnce(torrent => false)
        .mockImplementationOnce(torrent => false)
        .mockImplementationOnce(torrent => true)

      rutrackerProvider.isTorrentValid = isTorrentValidMock

      const actualResult = rutrackerProvider.mapValidTorrentsToMetaInfo([
        new TorrentMetaInfo('1', 'test1', 'testCategory1'),
        new TorrentMetaInfo('2', 'test2', 'testCategory2'),
        new TorrentMetaInfo('3', 'test3', 'testCategory3'),
        new TorrentMetaInfo('4', 'test4', 'testCategory4')
      ])
      expect(isTorrentValidMock.mock.calls).toHaveLength(4)
      expect(actualResult).toHaveLength(2)
      expect(actualResult[0].id).toBe('1')
      expect(actualResult[0].title).toBe('test1')
      expect(actualResult[0].category).toBe('testCategory1')
      expect(actualResult[1].id).toBe('4')
      expect(actualResult[1].title).toBe('test4')
      expect(actualResult[1].category).toBe('testCategory4')
    })
  })

  describe('Unit tests are releated to #getStreamsById', () => {
    test('Returns streams list for a specific movie by IMDB id', () => {
      const rutrackerProvider = new RutrackerStreamProviderService()

      axios.get.mockImplementationOnce(() => fs.readFile(`${testDataDir}/cinemetaResponseObject.json`).then(res => JSON.parse(res)))
      const apiLoginApiMock = jest.fn().mockImplementation(() => Promise.resolve())
      const searchApiMock = jest.fn().mockImplementation(() => Promise.resolve([{ id: '1' }, { id: '2' }, { id: '3' }]))
      const mapValidTorrentsToStreams = jest.fn().mockImplementation(() => [
        new Stream('hash1', 'title1'),
        new Stream('hash2', 'title2'),
        new Stream('hash3', 'title3')
      ])

      rutrackerProvider.api.login = apiLoginApiMock
      rutrackerProvider.api.search = searchApiMock
      rutrackerProvider.mapValidTorrentsToStreams = mapValidTorrentsToStreams

      return rutrackerProvider.getStreamsById('tt0075314').then(res => {
        expect(axios.get.mock.calls).toHaveLength(1)
        expect(apiLoginApiMock.mock.calls).toHaveLength(1)
        expect(res).toHaveLength(3)
        expect(res[0].infoHash).toBe('hash1')
        expect(res[0].title).toBe('title1')
        expect(res[1].infoHash).toBe('hash2')
        expect(res[1].title).toBe('title2')
        expect(res[2].infoHash).toBe('hash3')
        expect(res[2].title).toBe('title3')
      })
    })
  })
})
