export interface Content {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  artistId: string;
  artist?: {
    name: string;
    avatar?: string;
  };
  genre?: string;
  status: string;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}
