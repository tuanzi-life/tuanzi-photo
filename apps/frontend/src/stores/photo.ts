import { defineStore } from "pinia";
import type { Photo } from "../types";

const MOCK_PHOTOS: Photo[] = [
  {
    id: "1",
    url: "https://picsum.photos/seed/1/800/600",
    thumbnailUrl: "https://picsum.photos/seed/1/400/300",
    filename: "morning-light.jpg",
    tags: ["风景", "自然"],
  },
  {
    id: "2",
    url: "https://picsum.photos/seed/2/800/600",
    thumbnailUrl: "https://picsum.photos/seed/2/400/300",
    filename: "city-night.jpg",
    tags: ["城市", "夜景"],
  },
  {
    id: "3",
    url: "https://picsum.photos/seed/3/800/600",
    thumbnailUrl: "https://picsum.photos/seed/3/400/300",
    filename: "forest-path.jpg",
    tags: ["风景", "自然"],
  },
  {
    id: "4",
    url: "https://picsum.photos/seed/4/800/600",
    thumbnailUrl: "https://picsum.photos/seed/4/400/300",
    filename: "ocean-wave.jpg",
    tags: ["海洋", "自然"],
  },
  {
    id: "5",
    url: "https://picsum.photos/seed/5/800/600",
    thumbnailUrl: "https://picsum.photos/seed/5/400/300",
    filename: "mountain-peak.jpg",
    tags: ["风景", "山"],
  },
  {
    id: "6",
    url: "https://picsum.photos/seed/6/800/600",
    thumbnailUrl: "https://picsum.photos/seed/6/400/300",
    filename: "street-art.jpg",
    tags: ["城市", "艺术"],
  },
];

export const usePhotoStore = defineStore("photo", {
  state: () => ({
    photos: [] as Photo[],
    selectedTags: [] as string[],
    currentPhoto: null as Photo | null,
  }),

  getters: {
    filteredPhotos(state): Photo[] {
      if (state.selectedTags.length === 0) return state.photos;
      return state.photos.filter((p) => state.selectedTags.every((tag) => p.tags.includes(tag)));
    },

    allTags(state): { tag: string; count: number }[] {
      const map = new Map<string, number>();
      for (const photo of state.photos) {
        for (const tag of photo.tags) {
          map.set(tag, (map.get(tag) ?? 0) + 1);
        }
      }
      return Array.from(map.entries()).map(([tag, count]) => ({ tag, count }));
    },
  },

  actions: {
    fetchPhotos() {
      this.photos = MOCK_PHOTOS;
    },

    uploadPhoto() {
      const id = String(Date.now());
      this.photos.push({
        id,
        url: `https://picsum.photos/seed/${id}/800/600`,
        thumbnailUrl: `https://picsum.photos/seed/${id}/400/300`,
        filename: `photo-${id}.jpg`,
        tags: ["未分类"],
      });
    },

    deletePhoto(id: string) {
      this.photos = this.photos.filter((p) => p.id !== id);
      if (this.currentPhoto?.id === id) {
        this.currentPhoto = null;
      }
    },

    pushToScreen(_id: string) {
      // 模拟推送成功
    },

    toggleTag(tag: string) {
      const idx = this.selectedTags.indexOf(tag);
      if (idx === -1) {
        this.selectedTags.push(tag);
      } else {
        this.selectedTags.splice(idx, 1);
      }
    },

    setCurrentPhoto(photo: Photo | null) {
      this.currentPhoto = photo;
    },
  },
});
