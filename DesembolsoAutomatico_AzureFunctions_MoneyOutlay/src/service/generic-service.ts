import { ClassType, transformAndValidate } from 'class-transformer-validator';
import { Output } from "../util/output";
import { DataFriendlyError } from '../util/error';
import { ValidationError } from 'class-validator';

/**
    * NameSpace Implements Service generic validate request body
    * @namespace
    */
export namespace GenericService {

  /**
    * Validate content request
    * @method validateContentRequest
    * @param {any} pContext
    * @param {any} pInputClass
    */
  export async function validateContentRequest<TInput extends object>(
    pContext: any,
    pInputClass?: ClassType<TInput>,
  ): Promise<{ status: number; body: Output<any>; headers: {} }> {

    let res: { status: number; body: Output<any>; headers: {} };

    try {

      if (pContext.req === undefined) {
        console.log('req vacio');

        throw new DataFriendlyError('');

      } else {

        const input = await parseInput(pContext.req, pInputClass);

        if (input === undefined) {

          throw new DataFriendlyError('');

        }

      }

    } catch (exception) {

      if (Array.isArray(exception)) {

        const constraints = exception
          .filter(exception => exception instanceof ValidationError)
          .reduce((acc, exception) => acc.concat(exception.constraints), []);

        return Output.badRequest(constraints);

      } else if (exception instanceof DataFriendlyError) {

        return Output.error(exception.message);

      } else {

        return Output.internalError();

      }

    }

    return Output.ok(res);

  }

  /**
    * Validate and transform request to ClassType
    * @method parseInput
    * @param {any} pRequest
    * @param {any} pClassType
    */
  async function parseInput<TInput extends object>(pRequest: any, pClassType: ClassType<TInput>) {

    try {
      if (pClassType) {

        if (pRequest.body) {

          const parsereq= await transformAndValidate(pClassType, JSON.stringify(pRequest.body));
          console.log('el parser dio: '+JSON.stringify(parsereq));
          return parsereq;

        }

        throw new DataFriendlyError('');
      }
      
    }catch (exception) {
      console.log('el parser dio una excepcion: '+JSON.stringify(exception));
      return undefined;
    }

  }

}