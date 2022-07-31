import PrismaAccountRepository from "../src/infra/prisma/repositories/PrismaAccountRepository";
import fs from 'fs';

const FILE_PATH = `${process.cwd()}/lives.txt`;

(async()=> {
    const repository = new PrismaAccountRepository();
    const accounts = await repository.getFinishedAccounts();
    for(const account of accounts) {
        fs.appendFileSync(FILE_PATH, `${account}\n`);
    }
})();