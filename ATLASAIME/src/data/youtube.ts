/** 15 dernières vidéos publiques de https://www.youtube.com/@mattmezsax
 *  (flux RSS officiel, limité à 15 entrées par YouTube). Relevé le 16 oct. 2026. */

export const YOUTUBE_CHANNEL = {
  name: 'Matt Mez Sax',
  handle: '@mattmezsax',
  id: 'UCKINTpRnSl4hbxYdCX6eogQ',
  url: 'https://www.youtube.com/@mattmezsax',
  rss: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCKINTpRnSl4hbxYdCX6eogQ',
  note: 'YouTube ne publie que les 15 vidéos les plus récentes dans son flux. La chaîne en contient davantage.',
};

export interface YoutubeVideo {
  id: string;
  title: string;
  published: string;
  views: number;
  thumb: string;
  description: string;
}

export const YOUTUBE_VIDEOS: YoutubeVideo[] = [
  { id: 'ZK2gy2XUCDc', title: 'Presence', published: '2026-03-11', views: 105, thumb: 'https://i3.ytimg.com/vi/ZK2gy2XUCDc/hqdefault.jpg', description: '' },
  { id: 'd13gSxMCwKo', title: '✨ Popcorn salé, cœur sucré.', published: '2025-12-07', views: 1515, thumb: 'https://i1.ytimg.com/vi/d13gSxMCwKo/hqdefault.jpg', description: '' },
  { id: '5bnpy8x0CAQ', title: 'Amor, Lumière Du Monde', published: '2025-11-03', views: 148, thumb: 'https://i2.ytimg.com/vi/5bnpy8x0CAQ/hqdefault.jpg', description: '' },
  { id: 'iwIOO0oHhGs', title: 'PAX LUX AMOR (Afro Brass Anthem)', published: '2025-10-20', views: 157, thumb: 'https://i2.ytimg.com/vi/iwIOO0oHhGs/hqdefault.jpg', description: 'Création originale : inclusion, paix, amour, lumière.' },
  { id: 'gv1yhZcvPBc', title: 'La Danse du Ciel', published: '2025-10-13', views: 501, thumb: 'https://i4.ytimg.com/vi/gv1yhZcvPBc/hqdefault.jpg', description: 'Deep House · Lounge · Instrumental.' },
  { id: 'Ms-FSKQO-AM', title: 'Titanium', published: '2025-10-11', views: 2082, thumb: 'https://i2.ytimg.com/vi/Ms-FSKQO-AM/hqdefault.jpg', description: '' },
  { id: 'WjZuRMEdKSQ', title: 'Le mémoire de la louche invisible', published: '2025-10-09', views: 213, thumb: 'https://i4.ytimg.com/vi/WjZuRMEdKSQ/hqdefault.jpg', description: 'Cadeau pour Comines, imaginé par Matthieu Lecointre.' },
  { id: 'yYMS7qajzwM', title: "L'Arme du Ciel — Gabriel", published: '2025-10-03', views: 84, thumb: 'https://i2.ytimg.com/vi/yYMS7qajzwM/hqdefault.jpg', description: '' },
  { id: '8o0cXYhv3Ms', title: 'Voyage sonore vers la Lumière', published: '2025-10-02', views: 1295, thumb: 'https://i1.ytimg.com/vi/8o0cXYhv3Ms/hqdefault.jpg', description: '' },
  { id: 'GRIZU9DNNmI', title: 'Avec Matt Mez Sax on vole en Paix', published: '2025-09-30', views: 1800, thumb: 'https://i4.ytimg.com/vi/GRIZU9DNNmI/hqdefault.jpg', description: '' },
  { id: 'wSYDvKDoJb0', title: 'Marry You… Autrement', published: '2025-09-29', views: 1852, thumb: 'https://i4.ytimg.com/vi/wSYDvKDoJb0/hqdefault.jpg', description: '' },
  { id: 'dX9IhhNBEM8', title: 'Un mariage inclusif', published: '2025-09-28', views: 201123, thumb: 'https://i1.ytimg.com/vi/dX9IhhNBEM8/hqdefault.jpg', description: '' },
  { id: 'U9cKqqC5OqU', title: 'AVE MARIA', published: '2025-09-23', views: 505, thumb: 'https://i2.ytimg.com/vi/U9cKqqC5OqU/hqdefault.jpg', description: '' },
  { id: 'ip5tf0Wdzfc', title: 'Wedding Party Matt Mez Sax', published: '2025-09-15', views: 1300, thumb: 'https://i2.ytimg.com/vi/ip5tf0Wdzfc/hqdefault.jpg', description: '' },
  { id: 'DeDWbTCdY28', title: '1 septembre 2025', published: '2025-09-01', views: 334, thumb: 'https://i1.ytimg.com/vi/DeDWbTCdY28/hqdefault.jpg', description: '' },
];

export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;
