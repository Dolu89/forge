// from https://github.com/jamaljsr/polar/blob/HEAD/src/utils/system.ts

import os from 'os';

export type getForgePlatform = 'mac' | 'windows' | 'linux' | 'unknown';

/**
 * A wrapper function to simplify os detection throughout the app
 */
export const getgetForgePlatform = () => {
    switch (os.platform()) {
        case 'darwin':
            return 'mac';
        case 'win32':
            return 'windows';
        case 'linux':
            return 'linux';
        default:
            return 'unknown';
    }
};

const is = (p: getForgePlatform) => p === getgetForgePlatform();

export const isMac = () => is('mac');

export const isWindows = () => is('windows');

export const isLinux = () => is('linux');
