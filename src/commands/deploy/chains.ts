import { memoize } from "lodash";
import { SUPPORTED_CHAINS } from "../../config/internal-config";
import axios from "../../utils/axios";

type ChainsResponse = {
    data: {
        name: number,
        is_available: boolean,
        chain_id: number,
        aliases: string[],
    }[]
}

export const getChains = memoize(async function () {
    const chains = await axios.get<ChainsResponse>(`api/chains`)
        .catch(e => {
            console.warn('Failed to fetch chains from API, using default supported chains...');

            return {
                data: {
                    data: SUPPORTED_CHAINS
                        .map((chain_id) => ({
                            name: chain_id,
                            chain_id,
                            aliases: [],
                            is_available: true
                        }))
                }
            }
        })

    return chains.data.data;
})

export async function isChainAvailable(chainId: number) {
    const chains = await getChains()
    const chain = chains.find((chain) => chain.chain_id === chainId)
    return chain ? chain.is_available : false
}

export async function getChainAliases() {
    let chains = await getChains()
    return chains.map((chain) => chain.name + ':\t' + chain.aliases.slice(0, 2).join(', ')).join('\n')
}

export const getAllAliases = memoize(async function () {
    let chains = await getChains()

    const aliasToChainId = chains.reduce((acc: any, chain) => {
        chain.aliases.forEach((alias) => {
            acc[alias] = chain.chain_id
        })
        return acc
    }, {})

    return aliasToChainId
})

export async function aliasToChainId(alias: string | number) {
    const aliasToChainId = await getAllAliases()
    return aliasToChainId[alias] || null
}

export async function aliasesToChainId(aliases: (string | number)[]) {
    return await Promise.all(aliases.map(async (alias) => await aliasToChainId(alias)))
}