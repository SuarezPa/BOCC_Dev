
/**
    * Class Loan Customer
    * @class
    */
export class LoanCustumerDTO {
    constructor(
        public SldDisp: number, //Saldo disponible
        public indicadorCupoDisponible: string, // Bloqueo
        public expiraFecha: Date,
        public diasMora: number,
        public valorDesembolso: number, //Valor a desembolsar
        public PeriodicidadCapital: string, //Valor de la periodicidad capital
        public PlantillaTasa: string, //Valor de la periodicidad interes  
        public CodigoProducto: string, //Tipo de producto  
    ) {
    }
}