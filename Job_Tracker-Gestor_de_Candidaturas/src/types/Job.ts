export interface Job {
  id?: number;
  empresa: string;
  puesto: string;
  estado: 'CV Enviado' | 'Entrevista Técnica' | 'Oferta' | 'Rechazado';
}