import { cleanString } from "./clean-string";

export const techDataToItalian = (tech_data: string): string => {

    const tech_array: string[] = tech_data.split('-');
    let out: string = null;
    let video_quality: string = null;
    let audio_language: string = null;
    let subtitles: string = null;
    let other: string = null;

    tech_array.forEach(element => {
        const cleaned_element = cleanString(element);
        switch (cleaned_element) {

            case "ITA AAC":
            case "ITA MP3":
            case "ITA AC3":
                audio_language = "Audio: italiano";
                // Si noti che non scrivo nulla sul codec audio                
                break;

            case "ENG AAC":
            case "ENG MP3":
            case "ENG AC3":
                audio_language = "Audio: solo inglese";
                // Si noti che non scrivo nulla sul codec audio
                break;

            case "ITA ENG MP3":
            case "ITA ENG AC3":
            case "ITA ENG AC3 51":
            case "ITA AAC ENG AC3":
            case "ITA AC3 ENG EAC3": // errore di stumpa del releaser?
            case "ITA AC3 ENG AAC":
            case "ITA AC3 20 ENG AAC 5.1":
                audio_language = "Audio: italiano e inglese";
                // Si noti che non scrivo nulla sul codec audio
                break;

            case "ITA AC3 FRA FLAC":
                audio_language = "Audio: italiano e francese";
                // Si noti che non scrivo nulla sul codec audio
                break;

            case "ITA ENG FRA":
                audio_language = "Audio: italiano, inglese e francese";
                // Si noti che non scrivo nulla sul codec audio
                break;

            case "H264":
            case "H265":
                // Nulla da scrivere
                break;

            case "XVID":
            case "DIVX":
            case "MUX":
                video_quality = "Qualità video: non determinabile";
                break;
            case "DVD9":
                video_quality = "Qualità video: DVD";
                break;

            case "BDMUX 720P":
            case "MUX 720P":
            case "720P":
                video_quality = "Qualità video: HD Ready";
                break;


            case "MUX 1080P":
            case "1080P":
                video_quality = "Qualità video: Full HD";
                break;


            case "SUB ITA ENG":
                subtitles = "Sottotitoli: italiano e inglese";
                break;

            case "SUB ENG":
                subtitles = "Sottotitoli: inglese";
                break;

            case "MULTISUB":
                subtitles = "Sottotitoli: si, non elencati";
                break;

            default:
                console.error(`techDataToItalianHtml, non riconosciuto: ${element}`);
                other = (other ? other + "\n" + element : element);
        }
    });

    out = '';
    const video_icon = String.fromCodePoint(0x1F3A5);
    const world_icon = String.fromCodePoint(0x1F30D);
    const noaudio_icon = String.fromCodePoint(0x1F507);
    if (video_quality && video_quality.trim()) out = video_icon + " " + video_quality;
    if (audio_language && audio_language.trim()) out += `\n${world_icon} ${audio_language}`;
    if (subtitles && subtitles.trim() ) out += `\n${noaudio_icon} ${subtitles}`;
    if (other && other.trim() ) out += `\nAltre info: ${other}`;
    return out;
}