import { cleanString } from "./clean-string";

export const techDataToItalian = ( tech_data: string ) : string => {
    
    const tech_array : string[] = tech_data.split ('-');
    let out : string            = null;
    let video_quality  : string  = null;
    let video_codec    : string  = null;
    let audio_language : string  = null;
    let audio_codec    : string  = null;
    let subtitles      : string  = null;
    let other          : string  = null;

    tech_array.forEach( element => {
        const cleaned_element = cleanString(element);
        switch (cleaned_element) {
            case "ITA AAC":
                audio_language  = "Audio: italiano";
                audio_codec     = "Codec audio: AAC";
                break;
            case "ITA MP3":
                audio_language  = "Audio: italiano";
                audio_codec     = "Codec audio: MP3";
                break;
            case "ITA AC3": 
                audio_language  = "Audio: italiano";
                audio_codec     = "Codec audio: AC3";
                break;
            case "ITA ENG AC3": 
                audio_language  = "Audio: italiano e inglese";
                audio_codec     = "Codec audio: AC3";
                break;
            case "ITA ENG AC3 51":
                audio_language  = "Audio: italiano e inglese";
                audio_codec     = "Codec audio: AC3 5.1";
                break;
            case "ITA AAC ENG AC3":
                audio_language  = "Audio: italiano e inglese";
                audio_codec     = "Codec audio: AAC / AC3";
                break;
            case "ITA AC3 20 ENG AAC 5.1":
                audio_language  = "Audio: italiano e inglese";
                audio_codec     = "Codec audio: AC3 2.0 / AAC 5.1";
                break;
            case "DIVX":
                video_codec     = "Codec video: DIVX (sufficiente)";
                break;
            case "H264":
                video_codec     = "Codec video: H264 (molto buono)";
                break;
            case "H265":
                video_codec     = "Codec video: H265 (ottimo)";
                break;
            case "MUX":
                video_quality   = "Qualità video: non determinabile";
                break;
            case "MUX 720P":
            case "720P":
                video_quality   = "Qualità video: HD Ready";
                break;
            case "MUX 1080P":
                video_quality   = "Qualità video: Full HD";
                break;
            case "SUB ITA ENG":
                subtitles       = "Sottotitoli: italiano e inglese";
                break;
            default:
                console.warn (`techDataToItalianHtml, non riconosciuto: ${element}`);
                other = (other ? other + "\n" + element : element);
        }
    });

    out = '';
    if (video_quality)  out = video_quality; 
    if (video_codec)    out += `\n${video_codec}`;
    if (audio_language) out += `\n${audio_language}`;
    if (audio_codec)    out += `\n${audio_codec}`;
    if (subtitles)      out += `\n${subtitles}`;
    if (other)          out += `\n${other}`;
    return out;
}