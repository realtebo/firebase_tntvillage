import axios, { AxiosError } from 'axios';
import { TELEGRAM_API } from '../bot-api/constants';

export const deleteMessageFromChat = async ( chat_id, message_id) => {
    const params = {
        "chat_id"       : chat_id,
        "message_id"    : message_id,
    }
    await axios.post(TELEGRAM_API + "deleteMessage", params)
        .catch( (error : AxiosError) => {
            console.warn("Telegram KO", error.response.data);
        }) ;
}