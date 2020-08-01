const fs = require("fs/promises")
const RutrackerStreamProviderService = require("../src/services/RutrackerStreamProviderService")

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
        [`${__dirname}/data/validTorrent.json`, true],
        [`${__dirname}/data/invalidTorrent1.json`, false],
        [`${__dirname}/data/invalidTorrent2.json`, false],
        [`${__dirname}/data/invalidTorrent3.json`, false]
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
})
