export type InfoResult = {
  user: {
    pk: number;
    username: string;
    full_name: string;
    biography: string;

    is_business: boolean;
    is_potential_business: boolean;
    is_verified: boolean;
    is_private: boolean;

    follower_count: number;
    following_count: number;

    media_count: number;

    external_url: string;
    contact_phone_number: string;
    public_email: string;

    category: string;
  };
};
