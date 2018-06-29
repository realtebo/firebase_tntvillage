import axios, { AxiosError } from 'axios';
import { TELEGRAM_API } from './constants';

export const sendTo = async (chat_id: number, text: string) : Promise<void> => {
    const reply_telegram = {
        "text"    : text,
        "chat_id" : chat_id,
    }
    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram)
        .catch( (error : AxiosError) => {
            console.warn("Telegram KO", error.response.data);
        }) ;   
}