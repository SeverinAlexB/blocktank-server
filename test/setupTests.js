const { BlocktankDatabase } = require('@synonymdev/blocktank-worker2')
const entities = require(process.cwd() + '/src/1_database/entities/index')

const config = {
    entities: entities.default,
    debug: false,
    type: 'mongo',
    // clientUrl: 'mongodb://0.0.0.0:27017/blocktank-lsp-ln2',
  };


global.beforeAll(async () => {
    // await BlocktankDatabase.connect(config)
    await BlocktankDatabase.connectInMemory(config)
});

global.afterEach(async () => {
    await BlocktankDatabase.cleanDatabase()
});

global.afterAll(async () => {
    await BlocktankDatabase.close()
});