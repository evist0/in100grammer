export type Item = {
  taken_at: number;
  lng?: number;
  lat?: number;
};

export type PostsResult = {
  items: Item[];
};
