import Web3 from 'web3';
import * as KickstarterJSON from '../../../build/contracts/Kickstarter.json';
import { Kickstarter } from '../../types/Kickstarter';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};
const CONTRACT_ADDRESS = '0x675018732426094bE7dABB55Bd7F3f3aa5B7D991';
export class KickstarterWrapper {
    web3: Web3;

    contract: Kickstarter;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.address = CONTRACT_ADDRESS;
        this.contract = new web3.eth.Contract(KickstarterJSON.abi as any) as any;
        this.contract.options.address = CONTRACT_ADDRESS;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getTotalProjects(fromAddress: string) {
        const total = await this.contract.methods
            .getTotalProjects()
            .call({ ...DEFAULT_SEND_OPTIONS, from: fromAddress });
        return total;
    }

    async getProject(_projectId: number, fromAddress: string) {
        const project = await this.contract.methods
            .projects(_projectId)
            .call({ ...DEFAULT_SEND_OPTIONS, from: fromAddress });

        return project;
    }

    async vote(projectId: number, fromAddress: string) {
        const tx = await this.contract.methods
            .vote(projectId)
            .send({ ...DEFAULT_SEND_OPTIONS, from: fromAddress });
        return tx;
    }

    async createProject(title: string, description: string, fromAddress: string) {
        const tx = await this.contract.methods.createProject(title, description).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }
}
