import { db } from "~/db/db";


class SettingsService {

    async getStartPort() {
        const settings = await db.settings.get(1);
        return settings?.portStart || 9300;
    }

}

export default new SettingsService();