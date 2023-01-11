export type FriendshipsResult = {
  users: {
    pk: number;
    username: string;
    is_verified: boolean;
    is_private: boolean;
  }[];

  page_size: number;
};
