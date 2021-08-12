/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { KickstarterWrapper } from '../lib/contracts/KickstarterWrapper';
import { CONFIG } from '../config';
import { IProject } from '../types/app.d';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<KickstarterWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);

    const [title, setTitle] = useState<string>();
    const [description, setDescription] = useState<string>();
    const [projects, setProjects] = useState<IProject[]>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    useEffect(() => {
        if (contract && accounts) {
            getAllProjects();
        }
    }, [contract, accounts]);

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            const _contract = new KickstarterWrapper(_web3);
            setContract(_contract);

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const createProject = async () => {
        try {
            setTransactionInProgress(true);
            await contract.createProject(title, description, accounts?.[0]);
            toast('Your project successfully created and shared with Nervos Network ✔', {
                type: 'success'
            });
            await getAllProjects();
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    };

    const getSingleProject = async (projectId: number) => {
        try {
            const _project = await contract.getProject(projectId, accounts?.[0]);
            console.log('Single _project::', _project);
            return _project;
        } catch (error) {
            console.log('Getting single project error: ', error);
            return { id: 0, title: '', description: '', votes: 0 };
        }
    };

    const vote = async (e: any) => {
        const projectId = Number(e.target.id);
        console.log('ProjectId:::', projectId);
        try {
            setTransactionInProgress(true);
            const tx = await contract.vote(projectId, accounts?.[0]);
            console.log('TX::', tx);
            toast('Your vote successfully approved ✔', {
                type: 'success'
            });
            await getAllProjects();
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    };

    const getAllProjects = async () => {
        setLoading(true);
        const totalProjects = Number(await contract.getTotalProjects(accounts?.[0]));

        const _projects = [];

        for (let i = 1; i <= totalProjects; i++) {
            const _project = await getSingleProject(i);
            const newProject = {
                id: Number(_project.id),
                title: _project.title,
                description: _project.description,
                votes: Number(_project.votes)
            };
            _projects.push(newProject);
        }
        setProjects(_projects);
        setLoading(false);
    };

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div className="main">
            <h1>Nervos Project Kickstarter</h1>
            <div className="account-info">
                Your ETH address: <b>{accounts?.[0]}</b>
                <br />
                <br />
                Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
                <br />
                <br />
                Nervos Layer 2 balance:{' '}
                <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
                <br />
                <br />
                <hr />
            </div>

            <div className="create-kickstarter">
                <h4>Project Title</h4>
                <input type="text" value={title} onChange={(e: any) => setTitle(e.target.value)} />
                <h4>Project Description</h4>
                <textarea
                    rows={4}
                    value={description}
                    onChange={(e: any) => setDescription(e.target.value)}
                />

                <button className="submit" onClick={createProject}>
                    Create and Share Project
                </button>
            </div>
            {loading && (
                <div className="loading">
                    {' '}
                    <LoadingIndicator />
                    <br />
                    <small>Projects are laoding...</small>
                </div>
            )}
            {!loading && projects && (
                <div className="show-projects">
                    <h4> 🖥 Projects </h4>
                    <div className="projects">
                        {projects &&
                            projects.map(project => {
                                return (
                                    <div className="project" key={project.id}>
                                        <div className="project-header">
                                            <h2>{project.title}</h2>
                                            <div>
                                                ✅ <span>{project.votes}</span>
                                            </div>
                                        </div>
                                        <hr />
                                        <p>{project.description}</p>

                                        <hr />
                                        <button
                                            id={project.id.toString()}
                                            onClick={e => vote(e)}
                                            className="btn-vote"
                                        >
                                            Vote ✅
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
            <ToastContainer />
        </div>
    );
}
