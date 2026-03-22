import { defineStore } from 'pinia';
import api from '../api/axios';
import type { Job } from '../types/Job';

export const useJobStore = defineStore('jobStore', {
  state: () => ({
    jobs: [] as Job[],
    loading: false
  }),
  actions: {
    async fetchJobs() {
      this.loading = true;
      try {
        const { data } = await api.get<Job[]>('/jobs');
        this.jobs = data;
      } catch (error) {
        console.error("Error al traer vacantes:", error);
      } finally {
        this.loading = false;
      }
    },
    async addJob(newJob: Job) {
      try {
        const { data } = await api.post<Job>('/jobs', newJob);
        this.jobs.push(data);
      } catch (error) {
        console.error("Error al añadir:", error);
      }
    },
    async updateStatus(id: number, nuevoEstado: Job['estado']) {
      try {
        await api.put(`/jobs/${id}`, { estado: nuevoEstado });
        const job = this.jobs.find(j => j.id === id);
        if (job) job.estado = nuevoEstado;
      } catch (error) {
        console.error("Error al actualizar:", error);
      }
    },
    async deleteJob(id: number) {
      try {
        await api.delete(`/jobs/${id}`);
        this.jobs = this.jobs.filter(j => j.id !== id);
      } catch (error) {
        console.error("Error al borrar:", error);
      }
    }
  }
});