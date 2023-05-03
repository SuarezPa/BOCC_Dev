import { ParameterDto } from "../model/parameter-dto";
import DataTableService from "./data-table-service";
import { TableQuery } from 'azure-storage';
import * as azureTableStorage from 'azure-storage';
import * as error from '../util/error';
import { Output } from "../util/output";
import { ValidationError } from 'class-validator';
var tableSvc = azureTableStorage.createTableService(process.env.AZURE_TABLE_STORAGE_ACCOUNT_RATING, process.env.AZURE_TABLE_STORAGE_KEY_ACCESS_RATING);
/**
    * NameSpace Implements Parameter Table Storage Service
    * @namespace
    */
namespace ParameterService {


    /**
     * Method get Parameter List
         */
    export async function getParameterList(PartitionKey: string): Promise<{ status: number; body: Output<any>; headers: {} }> {

        const parameterDtoList: ParameterDto[] = [];

        try {

            const dataTableService = new DataTableService('ParametrosValidacion');

            const query = new TableQuery().top(10).where('PartitionKey == ?', PartitionKey);

            const response = await dataTableService.listEntities(query);

            if (response.isSuccessful) {

                const respondeBody = JSON.stringify(response.body);

                const parameterDtoJSONList = JSON.parse(respondeBody);

                parameterDtoJSONList.value.forEach(element => {

                    let parameterDto = new ParameterDto(element.NombreParametro, element.ValorParametro);

                    parameterDtoList.push(parameterDto);

                });

            } else {
                console.log("No pudo leer la tabla")

                throw new error.DataFriendlyError('Parameter not found');
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

        return Output.ok(parameterDtoList);

    }

    export async function getRatingClient(tipoIdentificacion: string, numeroIdentificacion: string): Promise<{ status: number; body: Output<any>; headers: {} }> {
       
        return new Promise(resolve => {
            tableSvc.retrieveEntity(process.env.AZURE_TABLE_STORAGE_ENTITY_NAME, tipoIdentificacion, numeroIdentificacion, (err, result, response) => {
                try {
                  if(err) throw new error.DataFriendlyError('Parameter not found');
                  
                } catch (exception) {
                    if (Array.isArray(exception)) {

                        const constraints = exception
                            .filter(exception => exception instanceof ValidationError)
                            .reduce((acc, exception) => acc.concat(exception.constraints), []);
        
                        return resolve(Output.badRequest(constraints));
        
                    } else if (exception instanceof error.DataFriendlyError) {
        
                        return resolve(Output.error(exception.message));
        
                    } else {
        
                        return resolve(Output.internalError());
        
                    }
                }
                
                return resolve(Output.ok(result)); 
            })
        })

    }
}

export default ParameterService;
