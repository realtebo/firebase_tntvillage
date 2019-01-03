import { refresh } from '../helpers/refresh';

export const cronjob_webhook = (req, res) => {

    refresh()
        .then( () => res.status(200).send("Cronjob refresh ok") )
        .catch( reason => res.status(500).send("cronjob_webhook fallito " + reason) );
}
