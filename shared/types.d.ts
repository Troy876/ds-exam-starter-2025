

export type MovieCrewRole = {
  movieId: number;
  role: string;
  names: string;
};

export type MovieCrewQueryParams = {
  movieId: string;
  name?: string;
  role?: string
}