import axios, { AxiosError } from 'axios';
import { TELEGRAM_API } from '../bot-api/constants';

export interface DeleteResult {
    success: boolean,
    message?: string,
}

export const deleteMessageFromChat = async ( chat_id, message_id) : Promise<DeleteResult> => {

    const params = {
        "chat_id"       : chat_id,
        "message_id"    : message_id,
    }

    await axios.post(TELEGRAM_API + "deleteMessage", params)
        .catch( (error : AxiosError) => {
            const { data } = error.response;

            // Sto cercando di cancellare un messaggio troppo vecchio
            if (data.ok === false && data.error_code === 400) {
                return <DeleteResult>{
                    message : "Messaggio non eliminabile",
                    success : false,
                }
            }

            // Errore non previsto
            console.warn("deleteMessageFromChat - Errore non previsto - ", data);
            return <DeleteResult>{
                message : data.description,
                success : false,
            }
        }) ;
    
    // Arrivo qui seil il messaggio è stato cancellato con successo
    return <DeleteResult>{
        success : true,
    }
}