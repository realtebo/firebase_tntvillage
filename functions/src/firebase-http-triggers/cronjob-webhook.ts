import { refresh } from '../helpers/refresh';

export const cronjob_webhook = async (req, res) => {
    const result: boolean = await refresh();
    if (!result) {
        res.status(500).send("Errore nel refresh via cronjob");
        return;
    } else {
        res.status(200).send("Cronjob refresh ok");
    }
}