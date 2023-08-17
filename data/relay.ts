import { RelayType } from '~/enums';

export default [
    {
        name: RelayType.NostrRsRelay,
        image: 'dolu89/forge-nostr-rs-relay',
        tags: [
            '0.8.12',
            '0.8.11'
        ],
        portStart: 9100
    },
    // {
    //     name: RelayType.Nostream,
    //     image: 'dolu89/forge-nostream',
    //     tags: [
    //         'v1.25.2',
    //     ],
    //     portStart: 9200
    // }
]