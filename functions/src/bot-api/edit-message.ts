import axios, { AxiosError } from 'axios';
import { TELEGRAM_API } from './constants';

export const editMessage = async (chat_id: number, message_id: number, new_text: string) : Promise<void> => {

    const params = {
        "chat_id"       : chat_id,
        "message_id"    : message_id,
        "text"          : new_text
    }

    await axios.post(TELEGRAM_API + "editMessageText", params)
        .catch( (error : AxiosError) => {
            console.warn("editMessageText - Telegram KO", params, error.response.data);
        })         
}
