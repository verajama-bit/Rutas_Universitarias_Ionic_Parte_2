export interface Ruta {
  /** Identificador único de la ruta */
  id?: number;
  /** Nombre de la ruta */
  nombre: string;
  /** Punto de salida */
  origen: string;
  /** Punto de llegada */
  destino: string;
  /** Horario de funcionamiento */
  horario: string;
  /** Valor del pasaje */
  tarifa: number;
  /** Nombre del conductor */
  conductor: string;
  /** Número o placa del bus */
  bus: string;
  /** Estado de la ruta */
  estado: 'Activa' | 'Inactiva';

  // ---- Campos de control de sincronización (offline-first) ----

  /** Id asignado por el backend una vez que el registro se sincroniza por primera vez */
  remote_id?: number | null;
  /** Estado de sincronización del registro local */
  sync_state?: 'pendiente' | 'sincronizado' | 'error';
  /** Fecha/hora (ISO) de la última modificación local */
  updated_at?: string | null;
  /** Fecha/hora (ISO) de la última sincronización exitosa con el servidor */
  last_synced_at?: string | null;
  /** Mensaje del último error de sincronización, si lo hubo */
  sync_error?: string | null;
}
