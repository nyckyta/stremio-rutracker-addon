const fs = require("fs/promises")
const axios = require("axios").default
const RutrackerStreamProviderService = require("../src/services/RutrackerStreamProviderService")

const testDataDir = `${__dirname}/data`

jest.mock("axios")

describe("Unit tests are related to RutrackerStreamProviderService", () => {

    describe("Unit tests are related to #retrieveTorrentInfoHash", () => {
        
        test("Retrieves info hash from magnet link", () => {
            const rutrackerProvider = new RutrackerStreamProviderService()
            const testMagnetLink = "magnet:?xt=urn:btih:F8597EA4AD8308CEEDCA4D7761DC5B6024DA318D&tr=http%3A%2F%2Fbt.t-ru.org%2Fann%3Fmagnet&dn=torrent_name"
            expect(rutrackerProvider.retrieveTorrentInfoHash(testMagnetLink)).toBe("f8597ea4ad8308ceedca4d7761dc5b6024da318d")
        })
    })
    
    describe("Unit tests are related to #retrieveTorrentInfoHashByRutrackerIds", () => {
        
        test("Retieves info hash from tracks ids", () => {
            const rutrackerProvider = new RutrackerStreamProviderService()
            const getMagnetLinkMock = jest.fn((id) => {
                return Promise.resolve(`magnetLink${id}`)
            })
            const retrieveTorrentInfoHashMock = jest.fn()
        
            rutrackerProvider.api.getMagnetLink = getMagnetLinkMock
            rutrackerProvider.retrieveTorrentInfoHash = retrieveTorrentInfoHashMock
            
            return rutrackerProvider.retrieveTorrentInfoHashByRutrackerIds(["1","2","3"]).then((res) => {
                expect(getMagnetLinkMock.mock.calls.length).toEqual(3)
                expect(getMagnetLinkMock.mock.calls[0][0]).toEqual("1")
                expect(getMagnetLinkMock.mock.calls[1][0]).toEqual("2")
                expect(getMagnetLinkMock.mock.calls[2][0]).toEqual("3")
        
                expect(retrieveTorrentInfoHashMock.mock.calls.length).toEqual(3)
            })
        })
    })
    
    describe.each([
        [`${testDataDir}/validTorrent.json`, true],
        [`${testDataDir}/invalidTorrent1.json`, false],
        [`${testDataDir}/invalidTorrent2.json`, false],
        [`${testDataDir}/invalidTorrent3.json`, false]
    ])("Unit tests are releated to #isTorrentValid method", (pathToTestData, expectedResult) => {

        test(`Returns true if torrent valid and false otherwise`, () =>  {
            const rutrackerProvider = new RutrackerStreamProviderService()
        
            return fs.readFile(pathToTestData, "utf-8").then(data => {
                torrent = JSON.parse(data)
                expect(rutrackerProvider.isTorrentValid(torrent)).toBe(expectedResult)    
            })
        })
    })

    describe("Unit tests are related to #mapValidTorrentsToTheirRutrackerId", () => {
        
        test(`Returns identifiers list of correct torrent entities`, () =>  {
            const rutrackerProvider = new RutrackerStreamProviderService()

            const isTorrentValidMock = jest
                .fn()
                .mockImplementationOnce(torrent => true)
                .mockImplementationOnce(torrent => false)
                .mockImplementationOnce(torrent => false)
                .mockImplementationOnce(torrent => true)
            
            rutrackerProvider.isTorrentValid = isTorrentValidMock

            actualResult = rutrackerProvider.mapValidTorrentsToTheirRutrackerId([{id: "1"}, {id: "2"}, {id: "3"}, {id: "4"}])    
            expect(isTorrentValidMock.mock.calls.length).toBe(4)
            expect(actualResult.length).toBe(2)
            expect(actualResult[0]).toBe("1")
            expect(actualResult[1]).toBe("4")
        })
    })

    describe("Unit tests are releated to #getStreamsById", () => {
        
        test("Returns streams list for a specific movie by IMDB id", () => {
            const rutrackerProvider = new RutrackerStreamProviderService()
             
            axios.get.mockImplementationOnce(() => fs.readFile(`${testDataDir}/cinemetaResponseObject.json`).then(res => JSON.parse(res)))
            const apiLoginApiMock = jest.fn().mockImplementation(() => Promise.resolve())
            const searchApiMock = jest.fn().mockImplementation(() => Promise.resolve([{"id": "1"}, {"id": "2"}, {"id": "3"}]))
            const mapValidTorrentsToTheirRutrackererIdMock = jest.fn().mockImplementation(() => Promise.resolve(["1", "2", "3"]))
            const retrieveTorrentInfoHashByRutrackerIdsMock = jest.fn().mockImplementation(() => Promise.resolve(["hash1", "hash2", "hash3"]))

            rutrackerProvider.api.login = apiLoginApiMock
            rutrackerProvider.api.search = searchApiMock
            rutrackerProvider.mapValidTorrentsToTheirRutrackerId = mapValidTorrentsToTheirRutrackererIdMock
            rutrackerProvider.retrieveTorrentInfoHashByRutrackerIds = retrieveTorrentInfoHashByRutrackerIdsMock

            return rutrackerProvider.getStreamsById("tt0075314").then(res => {
                expect(axios.get.mock.calls.length).toBe(1)
                expect(apiLoginApiMock.mock.calls.length).toBe(1)
                expect(mapValidTorrentsToTheirRutrackererIdMock.mock.calls.length).toBe(1)
                expect(retrieveTorrentInfoHashByRutrackerIdsMock.mock.calls.length).toBe(1)
                expect(res.length).toBe(3)
                expect(res[0].infoHash).toBe("hash1")
                expect(res[1].infoHash).toBe("hash2")
                expect(res[2].infoHash).toBe("hash3")
            })
        })
    })
})
