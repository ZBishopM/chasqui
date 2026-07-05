export type PowerId =
  | 'impulso_halcon'
  | 'lodo_sapo'
  | 'ignicion_amaru'
  | 'trueno_condor'
  | 'vision_puma'
  | 'vuelo_colibri';

export type FaseDuelo =
  | 'negacion'
  | 'ira'
  | 'ira_negociacion'
  | 'negociacion'
  | 'depresion'
  | 'depresion_profunda'
  | 'aceptacion'
  | 'climax';

export interface Departamento {
  readonly id: string;
  readonly nombre: string;
  readonly lugarHistorico: string;
  readonly poderObtenido: PowerId | null;
  readonly faseDuelo: FaseDuelo;
}

/** El Camino del Mensajero, tal como está definido en el GDD §13. */
export const CAMINO_DEL_MENSAJERO: readonly Departamento[] = [
  {
    id: 'ayacucho',
    nombre: 'Ayacucho',
    lugarHistorico: 'Vilcashuamán',
    poderObtenido: 'impulso_halcon',
    faseDuelo: 'negacion',
  },
  {
    id: 'huancavelica',
    nombre: 'Huancavelica',
    lugarHistorico: 'Uchkus Inkañan',
    poderObtenido: 'lodo_sapo',
    faseDuelo: 'ira',
  },
  {
    id: 'junin',
    nombre: 'Junín',
    lugarHistorico: 'Santuario de Chacamarca (Meseta de Bombón)',
    poderObtenido: null, // solo se refina el Impulso del Halcón, no hay poder nuevo propio
    faseDuelo: 'ira_negociacion',
  },
  {
    id: 'pasco',
    nombre: 'Pasco',
    lugarHistorico: 'Bosque de Piedras de Huayllay',
    poderObtenido: 'ignicion_amaru',
    faseDuelo: 'negociacion',
  },
  {
    id: 'huanuco',
    nombre: 'Huánuco',
    lugarHistorico: 'Huánuco Pampa',
    poderObtenido: 'trueno_condor',
    faseDuelo: 'depresion',
  },
  {
    id: 'ancash',
    nombre: 'Ancash',
    lugarHistorico: 'Chavín de Huántar',
    poderObtenido: 'vision_puma',
    faseDuelo: 'depresion_profunda',
  },
  {
    id: 'la_libertad',
    nombre: 'La Libertad',
    lugarHistorico: 'Marcahuamachuco',
    poderObtenido: 'vuelo_colibri',
    faseDuelo: 'aceptacion',
  },
  {
    id: 'cajamarca',
    nombre: 'Cajamarca',
    lugarHistorico: 'Plaza de Armas / Cuarto del Rescate',
    poderObtenido: null,
    faseDuelo: 'climax',
  },
];

/** Avanza al Chasqui por el Camino del Mensajero y lleva la cuenta de los poderes desbloqueados. */
export class Journey {
  private index = 0;

  get actual(): Departamento {
    return CAMINO_DEL_MENSAJERO[this.index];
  }

  get esFinal(): boolean {
    return this.index === CAMINO_DEL_MENSAJERO.length - 1;
  }

  /** Avanza al siguiente departamento (si no se ha llegado a Cajamarca) y lo devuelve. */
  avanzar(): Departamento {
    if (!this.esFinal) this.index++;
    return this.actual;
  }

  /** Poderes desbloqueados hasta el departamento actual, en el orden en que se obtienen. */
  get poderesDesbloqueados(): PowerId[] {
    return CAMINO_DEL_MENSAJERO.slice(0, this.index + 1)
      .map((d) => d.poderObtenido)
      .filter((p): p is PowerId => p !== null);
  }

  tienePoder(id: PowerId): boolean {
    return this.poderesDesbloqueados.includes(id);
  }
}
