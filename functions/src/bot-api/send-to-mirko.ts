import axios from 'axios';
import { MIRKO, TELEGRAM_API } from './constants';

export const sendToMirko = async (message: string) : Promise<void> => {
    const reply_telegram = {
        "text"    : message,
        "chat_id" : MIRKO,
    }
    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram);
}