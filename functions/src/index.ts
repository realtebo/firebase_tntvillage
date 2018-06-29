import * as functions from 'firebase-functions';

// Risponditori dei trigger di tipo http di Google Cloud
import { telegram_callback} from './firebase-http-triggers/telegram-callback';
import { cronjob_webhook } from './firebase-http-triggers/cronjob-webhook';

// Risponditori dei trigger di tipo database di Google Cloud
import { row_onwrite } from './firebase-db-triggers/row-onwrite';
import { to_notify_oncreate } from './firebase-db-triggers/to-notify-oncreate';


/**************************
 *     TRIGGER HTTP
 *************************/

// Chiamato da https://cron-job.org/
exports.refresh = functions.https.onRequest( cronjob_webhook );

// Risponde agli eventi di Telegram
exports.callback = functions.https.onRequest( telegram_callback );


/**************************
 *    TRIGGER DATABASE
 *************************/

// E' variato qualche dato di un episodio
exports.onRowChanged_v30 = functions.database.ref(`rows/{seg_1}/{seg_2}/{seg_3}/{seg_4}/{seg_5}`)
    .onWrite ( row_onwrite );

// E' stata aggiunta una nuova notifica in coda
exports.onToBeNotified_v6 = functions.database.ref(`to_notify/{hash}`)
    .onCreate( to_notify_oncreate );

