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
}
