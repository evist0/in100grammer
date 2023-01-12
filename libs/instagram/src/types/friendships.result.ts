export type FriendshipUser = {
  pk: number;
  username: string;
  is_verified: boolean;
  is_private: boolean;
};

export type FriendshipsResult = {
  users: FriendshipUser[];

  page_size: number;
};
