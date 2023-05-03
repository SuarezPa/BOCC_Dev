import {
    createTableService,
    services,
    ServiceResponse,
    TableQuery
} from 'azure-storage';

type TableService = services.table.TableService;

interface IDataTableService {
    getEntity(partitionKey: string, rowKey: string): Promise<ServiceResponse>;
    listEntities(query: TableQuery): Promise<ServiceResponse>;
}

class DataTableService implements IDataTableService {

    private tableService: TableService;

    constructor(private tableName: string) {
        this.tableName = tableName;
        this.tableService = createTableService();
    }

    getEntity(partitionKey: string, rowKey: string): Promise<ServiceResponse> {
        return new Promise(async (resolve, reject) => {

            this.tableService.retrieveEntity(
                this.tableName,
                partitionKey,
                rowKey,
                (error, _, response) => {
                    if (!error) {
                        resolve(response);
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }

    listEntities(query: TableQuery): Promise<ServiceResponse> {
        return new Promise(async (resolve, reject) => {

            this.tableService.queryEntities(
                this.tableName,
                query,
                null,
                (error, _, response) => {
                    if (!error) {
                        resolve(response);
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }
}

export default DataTableService;