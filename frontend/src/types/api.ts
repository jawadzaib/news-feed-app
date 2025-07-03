export type User = {
  id: number;
  name: string;
  email: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: User;
  token: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type RegisterResponse = {
  message: string;
  user: User;
  token: string;
};

export type PaginatedResponse<T> = {
  current_page: number;
  data: T[]; // Array of the actual data type (e.g., Article[])
  first_page_url: string | null;
  from: number;
  last_page: number;
  last_page_url: string | null;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
};

export type Article = {
  id: number;
  source_id: number;
  category_id: number | null;
  api_article_id: string | null;
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  url_to_image: string | null;
  published_at: string;
  content: string | null;
  created_at: string;
  updated_at: string;
  source: Source;
  category: Category | null;
};

export type Source = {
  id: number;
  name: string;
  api_id: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type UserPreference = {
  id: number;
  user_id: number;
  preferred_sources: number[];
  preferred_categories: number[];
  preferred_authors: string[];
  created_at: string;
  updated_at: string;
};
