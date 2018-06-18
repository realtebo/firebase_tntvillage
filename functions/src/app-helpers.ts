import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp();
}

const myDb = admin.database();
const myBucket = admin.storage().bucket();

export {
    myDb     as db,
    myBucket as bucket,
}
