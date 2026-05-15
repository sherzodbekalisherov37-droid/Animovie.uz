import { FieldValue } from 'firebase/firestore';

export interface Episode {
  title: string;
  url: string;
  season?: number;
}

export interface Movie {
  id: string;
  title: string;
  image: string;
  genre: string;
  year: string;
  description?: string;
  isBanner?: boolean;
  is18Plus?: boolean;
  episodes?: Episode[];
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
}

export interface Settings {
  id: 'global';
  telegram?: string;
  instagram?: string;
}

export interface Comment {
  id: string;
  movieId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: FieldValue;
}
