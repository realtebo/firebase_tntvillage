import { SEAESON_REGEXP } from './constants';

export interface ItalianEpisodeDescriptor {
     season_it: string,
     episode_it: string
}

export const episodesToItalian = (episodes: string): ItalianEpisodeDescriptor => {

     if (!episodes) {
          return <ItalianEpisodeDescriptor>{
               season_it: "Stagione non determinabile",
               episode_it: "Episodi non determinabili"
          };
     }

     const matches: RegExpMatchArray = episodes.match(SEAESON_REGEXP);

     let season_it: string = "";
     if (matches[3]) {
          season_it += `Stagioni da ${matches[2]} a ${matches[4]}`;
     } else {
          season_it += `Stagione ${matches[2]}`;
     }

     let episode_it: string = "";
     if (matches[6]) {
          episode_it += `Episodi da ${matches[5]} a ${matches[8]}`;
     } else {
          episode_it += `Episodio ${matches[5]}`;
     }

     return <ItalianEpisodeDescriptor>{ episode_it, season_it };
}