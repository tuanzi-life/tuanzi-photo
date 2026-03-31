import { defineStore } from "pinia";
import { useToast } from "@nuxt/ui/composables/useToast";
import type { Photo } from "../types";
import type { ApiResponse, PhotoListResponse, PhotoVO } from "@tuanzi-photo/shared-types";

export const usePhotoStore = defineStore("photo", {
  state: () => ({
    photos: [] as Photo[],
    selectedTags: [] as string[],
    currentPhoto: null as Photo | null,
    loading: false,
  }),

  getters: {
    filteredPhotos(state): Photo[] {
      if (state.selectedTags.length === 0) return state.photos;
      return state.photos.filter((p) =>
        state.selectedTags.every((tag) => p.tags.includes(tag))
      );
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
    async fetchPhotos() {
      const toast = useToast();
      this.loading = true;
      try {
        const res = await fetch("/api/v1/photos");
        const body: ApiResponse<PhotoListResponse> = await res.json();
        if (body.code === 0) {
          this.photos = body.data.items;
        } else {
          toast.add({ title: body.message, color: "error" });
        }
      } catch {
        toast.add({ title: "加载照片失败，请检查网络", color: "error" });
      } finally {
        this.loading = false;
      }
    },

    async uploadPhoto(file: File, tags: string[]) {
      const toast = useToast();
      const form = new FormData();
      form.append("file", file);
      if (tags.length > 0) {
        form.append("tags", tags.join(","));
      }
      try {
        const res = await fetch("/api/v1/photos/upload", { method: "POST", body: form });
        const body: ApiResponse<PhotoVO> = await res.json();
        if (body.code === 0) {
          this.photos.unshift(body.data);
          toast.add({ title: "上传成功", color: "success" });
        } else {
          toast.add({ title: body.message, color: "error" });
        }
      } catch {
        toast.add({ title: "上传失败，请检查网络", color: "error" });
      }
    },

    async deletePhoto(id: number) {
      const toast = useToast();
      try {
        const res = await fetch(`/api/v1/photos/${id}`, { method: "DELETE" });
        const body: ApiResponse<null> = await res.json();
        if (body.code === 0) {
          this.photos = this.photos.filter((p) => p.id !== id);
          if (this.currentPhoto?.id === id) {
            this.currentPhoto = null;
          }
        } else {
          toast.add({ title: body.message, color: "error" });
        }
      } catch {
        toast.add({ title: "删除失败，请检查网络", color: "error" });
      }
    },

    async pushToScreen(id: number) {
      const toast = useToast();
      try {
        const res = await fetch(`/api/v1/photos/${id}/push`, { method: "POST" });
        const body: ApiResponse<null> = await res.json();
        if (body.code === 0) {
          toast.add({ title: "推送成功，正在刷新", color: "success" });
        } else if (body.code === 409) {
          toast.add({ title: "墨水屏正在刷新，请稍后再试", color: "warning" });
        } else {
          toast.add({ title: body.message, color: "error" });
        }
      } catch {
        toast.add({ title: "推送失败，请检查网络", color: "error" });
      }
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
