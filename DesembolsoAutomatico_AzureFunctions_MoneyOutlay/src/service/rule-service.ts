import ParameterService from "./parameter-service";
import * as error from '../util/error';
import { Output } from "../util/output";
import { ValidationError } from 'class-validator';
import { LoanCustumerDTO } from "../model/loan-customer-dto";
import { HttpRequest } from '@azure/functions';

/**
    * NameSpace Implements Service generic validate request body
    * @namespace
    */
namespace RuleService {

    /* Validaciones de condiciones del cupo del cliente */
    export async function validateLoanCustomer(pLoanInformation: LoanCustumerDTO):
        Promise<{ status: number; body: Output<any>; headers: {} }> {
        const parameterResponse = await ParameterService.getParameterList("ValidacionCupo");
        const messageResponse: string[] = [];
        console.log('obtuvo parametros: ' + JSON.stringify(parameterResponse.body.data));

        let today = new Date();
        let fecha = new Date(pLoanInformation.expiraFecha);
        let tipoE: number[] = [];

        if (parameterResponse.status) {

            try {
                let statusValidation: number = 0;

                parameterResponse.body.data.forEach(parameterDto => {

                    if (parameterDto.name == "MinimoMonto") {
                        /*Validar Monto mínimo a solicitar*/
                        if (pLoanInformation.valorDesembolso >= parseInt(parameterDto.value)) {
                            statusValidation = statusValidation + 1;
                            messageResponse.push('Cumple validación: ' + parameterDto.name);
                        } else {
                            messageResponse.push('No cumple validación: ' + parameterDto.name);
                            tipoE.push(7048);
                        }

                    } else if (parameterDto.name == "IndicadorCupoDisponible") {
                        /*Validar Indicador Cupo Disponible*/
                        if (pLoanInformation.indicadorCupoDisponible == parameterDto.value) {
                            statusValidation = statusValidation + 1;
                            messageResponse.push('Cumple validación: ' + parameterDto.name);
                        } else {
                            messageResponse.push('No cumple validación: ' + parameterDto.name);
                            tipoE.push(7046);
                        }

                    } else if (parameterDto.name == "MaximoDiasMora") {
                        /*Validar dias de mora */
                        if (pLoanInformation.diasMora <= parseInt(parameterDto.value)) {
                            statusValidation = statusValidation + 1;
                            messageResponse.push('Cumple validación: ' + parameterDto.name);
                        } else {
                            messageResponse.push('No cumple validación: ' + parameterDto.name);
                            tipoE.push(7044);
                        }
                    }
                });

                /*Validación correcta creacion de las parejas peridicidad capital e interes*/
                if (pLoanInformation.CodigoProducto == 'U015') {
                    if (pLoanInformation.PeriodicidadCapital == 'M' && pLoanInformation.PlantillaTasa == 'DIBRMVPD' || 
                    pLoanInformation.PeriodicidadCapital == 'Q' && pLoanInformation.PlantillaTasa == 'DIBRMVPD' ||
                    pLoanInformation.PeriodicidadCapital == 'H' && pLoanInformation.PlantillaTasa == 'DIBRMVPD' ||
                    pLoanInformation.PeriodicidadCapital == null && pLoanInformation.PlantillaTasa == 'DIBRMVPD') {
                        statusValidation = statusValidation + 1;
                        messageResponse.push(`Cumple validación: Pareja peridicidad capital - interes son validas: ${pLoanInformation.PeriodicidadCapital}, ${pLoanInformation.PlantillaTasa}`);
                    } else if (pLoanInformation.PeriodicidadCapital == 'Q' && pLoanInformation.PlantillaTasa == 'DIBRTVPD'||
                    pLoanInformation.PeriodicidadCapital == 'H' && pLoanInformation.PlantillaTasa == 'DIBRTVPD' ||
                    pLoanInformation.PeriodicidadCapital == null && pLoanInformation.PlantillaTasa == 'DIBRTVPD'){
                        statusValidation = statusValidation + 1;
                        messageResponse.push(`Cumple validación: Pareja peridicidad capital - interes son validas: ${pLoanInformation.PeriodicidadCapital}, ${pLoanInformation.PlantillaTasa}`);
                    } else if (pLoanInformation.PeriodicidadCapital == 'H' && pLoanInformation.PlantillaTasa == 'DIBRSVPD' ||
                    pLoanInformation.PeriodicidadCapital == null && pLoanInformation.PlantillaTasa == 'DIBRSVPD')
                    {
                        statusValidation = statusValidation + 1;
                        messageResponse.push(`Cumple validación: Pareja peridicidad capital - interes son validas: ${pLoanInformation.PeriodicidadCapital}, ${pLoanInformation.PlantillaTasa}`);
                    } else {                    
                        tipoE.push(7049);
                        messageResponse.push(`No cumple validación: Pareja peridicidad capital - interes NO son validas: ${pLoanInformation.PeriodicidadCapital}, ${pLoanInformation.PlantillaTasa}`);
                    }
                }   else if (pLoanInformation.CodigoProducto == 'U012'){
                    if (pLoanInformation.PeriodicidadCapital == null && pLoanInformation.PlantillaTasa == 'DIBRMVPD' || pLoanInformation.PeriodicidadCapital == 'M' && pLoanInformation.PlantillaTasa == 'DIBRMVPD')
                    {
                        statusValidation = statusValidation + 1;
                        messageResponse.push(`Cumple validación: Pareja peridicidad capital - interes son validas: ${pLoanInformation.PeriodicidadCapital}, ${pLoanInformation.PlantillaTasa}`);
                    } else {                    
                        tipoE.push(7049);
                        messageResponse.push(`No cumple validación: Pareja peridicidad capital - interes NO son validas: ${pLoanInformation.PeriodicidadCapital}, ${pLoanInformation.PlantillaTasa}`);
                    }
                }

                    /*Validación cupo disponible */
                if (pLoanInformation.valorDesembolso <= pLoanInformation.SldDisp) {
                    statusValidation = statusValidation + 1;
                    messageResponse.push('Cumple validación: Saldo Disponible');
                } else {
                    tipoE.push(7041);
                    messageResponse.push('No cumple validación: Saldo Disponible');
                }

                               /*Validar Fecha de expiración*/
                if (fecha >= today) {
                    statusValidation = statusValidation + 1;
                    messageResponse.push('Cumple validación: Fecha de expiración');
                } else {
                    messageResponse.push('No cumple validación: Fecha de expiración');
                    tipoE.push(7047);
                }

                if (statusValidation != 6) {

                    console.log('No se cumplieron una o mas reglas');
                    console.log(messageResponse);
                    return Output.errorValidaciones(messageResponse, tipoE);
                } else {
                    return Output.ok(messageResponse);
                }

            } catch (exception) {

                if (Array.isArray(exception)) {

                    const constraints = exception
                        .filter(exception => exception instanceof ValidationError)
                        .reduce((acc, exception) => acc.concat(exception.constraints), []);

                    return Output.badRequest(constraints);

                } else if (exception instanceof error.DataFriendlyError) {

                    return Output.error(exception.message);

                } else {

                    return Output.internalError();

                }

            }

        } else {

            return parameterResponse;

        }

    }

    export async function validateCifinCustomer(pCifinInformationBody: HttpRequest):
        Promise<{ status: number; body: Output<any>; headers: {} }> {
        const parameterResponse = await ParameterService.getParameterList("ValidacionCifin");
        const messageResponse: string[] = [];
        let calificacionPermitida: any = [];
        let porcentajeDeudaTotal: any = [];
        let Endeudamiento91: any = [];
        let ResumenPrincipal: any;

        let IdentificadorLinea: string = (pCifinInformationBody.body && pCifinInformationBody.body.IdentificadorLinea);

        if (!IdentificadorLinea) return Output.badRequestCifinInformation('Información suministrada de manera incorrecta.')

        let pCifinInformation: any = pCifinInformationBody.body;

        if (parameterResponse.status) {

            try {
                let statusValidation: boolean = false;

                calificacionPermitida = parameterResponse.body.data.filter((v) => (v.name == 'CalificacionPermitida')).map((v) => v.value);
                porcentajeDeudaTotal = parameterResponse.body.data.filter((v) => (v.name == 'PorcentajeDeudaTotal')).map((v) => v.value);
                
                if (pCifinInformation.Endeudamiento) {
                    Endeudamiento91 = (typeof pCifinInformation.Endeudamiento.EndeudamientoTrimIII === 'undefined') ? [] : pCifinInformation.Endeudamiento.EndeudamientoTrimIII.Endeudamiento91.filter((v) => (calificacionPermitida.indexOf(v.Calificacion) == -1 && ['TOT', '', 'NA'].indexOf(v.Calificacion) == -1));    
                }
                ResumenPrincipal = (typeof pCifinInformation.Consolidado === 'undefined') ? [] : pCifinInformation.Consolidado.ResumenPrincipal.Registro.filter((v) => (v.PaqueteInformacion == 'Subtotal Principal'));

                if (!(ResumenPrincipal.length == 0 || (parseFloat(ResumenPrincipal[0].TotalSaldo) * parseFloat(porcentajeDeudaTotal[0])) >= parseFloat(ResumenPrincipal[0].SaldoObligacionesMora))) {
                    messageResponse.push('No cumple validación SaldoObligacionesMora');
                    statusValidation = true;
                } else {
                    messageResponse.push('Cumple validación SaldoObligacionesMora');
                }

                if (Endeudamiento91.length) {
                    messageResponse.push('No cumple validación Calificación');
                    statusValidation = true;
                } else {
                    messageResponse.push('Cumple validación Calificación');
                }

                if (statusValidation) {
                    return Output.errorValidaciones(messageResponse, [7043])
                } else {
                    return Output.ok(messageResponse);
                }

            } catch (exception) {

                if (Array.isArray(exception)) {

                    const constraints = exception
                        .filter(exception => exception instanceof ValidationError)
                        .reduce((acc, exception) => acc.concat(exception.constraints), []);

                    return Output.badRequest(constraints);

                } else if (exception instanceof error.DataFriendlyError) {

                    return Output.error(exception.message);

                } else {

                    return Output.internalError();

                }

            }

        } else {

            return parameterResponse;

        }

    }

    export async function validateIdClient(pIdClient: HttpRequest): Promise<{ status: number; body: Output<any>; headers: {} }> {

        let Nit = (pIdClient.body && pIdClient.body.numeroIdentificacion);
        if (!Nit) return Output.genericError('Información suministrada de manera incorrecta.', false, 400, 600);
        try {
            var vpri,
                x,
                y,
                z;

            // Se limpia el Nit
            Nit = Nit.replace(/\s/g, ""); // Espacios
            Nit = Nit.replace(/,/g, ""); // Comas
            Nit = Nit.replace(/\./g, ""); // Puntos
            Nit = Nit.replace(/-/g, ""); // Guiones

            // Se valida el nit
            if (isNaN(Nit)) {
                console.log("El nit/cédula '" + Nit + "' no es válido(a).");
                return Output.genericError(`El nit/cédula ${Nit} no es válido(a).`, false, 202, 600, { result: false });
            };

            // Procedimiento
            vpri = new Array(16);
            z = Nit.length;



            vpri[1] = 3;
            vpri[2] = 7;
            vpri[3] = 13;
            vpri[4] = 17;
            vpri[5] = 19;
            vpri[6] = 23;
            vpri[7] = 29;
            vpri[8] = 37;
            vpri[9] = 41;
            vpri[10] = 43;
            vpri[11] = 47;
            vpri[12] = 53;
            vpri[13] = 59;
            vpri[14] = 67;
            vpri[15] = 71;



            x = 0;
            y = 0;
            for (var i = 0; i < z; i++) {
                y = (Nit.substr(i, 1));
                x += (y * vpri[z - i]);
            }



            y = x % 11;

            return Output.genericError(`El nit/cédula ${Nit} es válido.`, true, 200, 0, { result: ((y > 1) ? 11 - y : y) });
        } catch (exception) {

            if (Array.isArray(exception)) {

                const constraints = exception
                    .filter(exception => exception instanceof ValidationError)
                    .reduce((acc, exception) => acc.concat(exception.constraints), []);

                return Output.badRequest(constraints);

            } else if (exception instanceof error.DataFriendlyError) {

                return Output.error(exception.message);

            } else {

                return Output.internalError();

            }

        }

    }

    export async function validateRatingClient(pIdClient: HttpRequest): Promise<{ status: number; body: Output<any>; headers: {} }> {
        let numeroIdentificacion = (pIdClient.body && pIdClient.body.numeroIdentificacion);
        let tipoIdentificacion = (pIdClient.body && pIdClient.body.tipoIdentificacion);
        let data;
        if (!numeroIdentificacion || !tipoIdentificacion) return Output.genericError('Información suministrada de manera incorrecta.', false, 400, 600);
        try {
            const parameterResponse = await ParameterService.getRatingClient(tipoIdentificacion, numeroIdentificacion);
            
            if (parameterResponse.body.success) {
                data = parameterResponse.body.data;
                if (["", "1", "2", "3", "4"].indexOf(data.rating["_"]) !== -1) {
                    return Output.ok({ response: true });
                }
                return Output.okGeneric("El cliente no cumple con las políticas", 600, { response: false });
            } else {
                return Output.ok({ response: true });
            }
        } catch (exception) {

            if (Array.isArray(exception)) {

                const constraints = exception
                    .filter(exception => exception instanceof ValidationError)
                    .reduce((acc, exception) => acc.concat(exception.constraints), []);

                return Output.badRequest(constraints);

            } else if (exception instanceof error.DataFriendlyError) {

                return Output.error(exception.message);

            } else {

                return Output.internalError();

            }

        }

    }
}
export default RuleService;
