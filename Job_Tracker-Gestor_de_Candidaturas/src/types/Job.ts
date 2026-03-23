export interface Job {
  id?: number;
  title: string;
  company: string;
  location: string;
  description: string;
  status: 'CV Enviado' | 'Entrevista Técnica' | 'Oferta' | 'Rechazado';
}