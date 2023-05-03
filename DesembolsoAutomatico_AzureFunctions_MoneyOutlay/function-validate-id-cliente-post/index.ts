import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import RuleService from '../src/service/rule-service';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.res = await RuleService.validateIdClient(req);
};

export default httpTrigger;