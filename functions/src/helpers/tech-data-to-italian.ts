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
            case "ITA AAC AC3":
                audio_language = "🇮🇹";
                // Si noti che non scrivo nulla sul codec audio                
                break;

            case "ENG AAC":
            case "ENG MP3":
            case "ENG AC3":
                audio_language = "🇬🇧";
                // Si noti che non scrivo nulla sul codec audio
                break;

            case "ITA ENG":
            case "ITA ENG MP3":
            case "ITA ENG AC3":
            case "ITA ENG AC3 51":
            case "ITA AAC ENG AC3":
            case "ITA AC3 ENG EAC3": // errore di stumpa del releaser?
            case "ITA AC3 ENG AAC":
            case "ITA AC3 20 ENG AAC 5.1":
                audio_language = "🇮🇹 + 🇬🇧";
                // Si noti che non scrivo nulla sul codec audio
                break;

            case "ITA AC3 FRA FLAC":
                audio_language = "🇮🇹 + 🇫🇷";
                // Si noti che non scrivo nulla sul codec audio
                break;

            case "ITA ENG FRA":
                audio_language = "🇮🇹 + 🇬🇧 + 🇫🇷";
                // Si noti che non scrivo nulla sul codec audio
                break;
            case "ITA ENG GER AC3 51":
                audio_language = "🇮🇹 + 🇬🇧 + 🇩🇪";
                break;

            case "ITA SPA AC3 51":
                audio_language = "🇮🇹 + 🇪🇸";
                break;

            case "H264":
            case "H265":
                // Nulla da scrivere
                break;

            case "XVID":
            case "DIVX":
            case "MUX":
            case "SATRIP":
                video_quality = "Qualità video non determinabile";
                break;
            case "DVD9":
            case "DVDRIP":
                video_quality = "⭐ Qualità DVD";
                break;

            case "BDMUX 720P":
            case "BDRIP 720P":
            case "SATRIP 720P":
            case "MUX 720P":
            case "720P":
                video_quality = "⭐⭐ HD Ready";
                break;

            case "BDMUX 10800P":
            case "MUX 1080P":
            case "1080P":
            case "HDTV 1080I":
                video_quality = "⭐⭐⭐ Full HD";
                break;

            case "SUB ITA":
                subtitles = "🇮🇹";
                break;

            case "SUB ITA ENG":
                subtitles = "🇮🇹 + 🇬🇧";
                break;

            case "SUB ENG":
                subtitles = "🇬🇧";
                break;

            case "MULTISUB":
                subtitles = "✔️ (lingue non specificate)";
                break;

            default:
                console.error(`techDataToItalianHtml, non riconosciuto: ${element}`);
                other = (other ? other + "\n" + element : element);
        }
    });

    out = '';

    if (audio_language && audio_language.trim()) out += (out.trim() ? "\n" : "") + `${audio_language}`;
    if (video_quality && video_quality.trim()) out += (out.trim() ? "\n" : "") + `${video_quality}`;

    // if (subtitles && subtitles.trim()) out += (out.trim() ? "\n" : "") + `📜 ${subtitles}`;
    if (other && other.trim()) out += (out.trim() ? "\n" : "") + `ℹ️ Altre info: ${other}`;
    return out;
}