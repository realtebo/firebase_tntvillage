import { SEAESON_REGEXP } from './constants';

export interface ItalianEpisodeDescriptor {
     season_it: string,
     episode_it: string
}

export const episodesToItalian = (episodes: string): ItalianEpisodeDescriptor => {

     if (!episodes || typeof episodes === "undefined" || episodes === null) {
          return <ItalianEpisodeDescriptor>{
               season_it: "Stagione non precisata",
               episode_it: "Episodi non precisati"
          };
     }

     let matches: RegExpMatchArray;
     try {
          matches = episodes.match(SEAESON_REGEXP);
     } catch (e) {
          console.warn('[episodes_to_italian.ts][episodes_to_italian()] match ha generato un eccezione con il valore episodes = ', episodes);
          return <ItalianEpisodeDescriptor>{
               season_it: "Stagione non determinabile",
               episode_it: "Episodi non determinabili"
          };
     }


     let season_it: string = "";
     if (matches[3]) {
          if (matches[4] === (matches[2] + 1)) {
               season_it += `Stagioni ${matches[2]} e ${matches[4]}`;
          } else {
               season_it += `Stagioni da ${matches[2]} a ${matches[4]}`;
          }
     } else {
          season_it += `Stagione ${matches[2]}`;
     }

     let episode_it: string = "";
     if (matches[6]) {
          if (matches[8] === (matches[5] + 1)) {
               episode_it += `episodi ${matches[5]} e ${matches[8]}`;
          } else {
               episode_it += `episodi da ${matches[5]} a ${matches[8]}`;
          }

     } else {
          episode_it += `episodio ${matches[5]}`;
     }

     return <ItalianEpisodeDescriptor>{ episode_it, season_it };
}