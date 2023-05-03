export class Output<T> {

  success: boolean = true;

  data: T;

  message: string;

  dateTime = new Date().toISOString();

  errorCod: number;

  static out(status: number, body: any) {
    return {
      status,
      body,
      headers: {
        'Content-Type': 'application/json',
      }
    };
  }

  static ok(data?: any) {
    const output = new Output();

    output.message = "Todas las políticas se cumplieron";
    if (typeof data === 'object') {
      if (data != null) output.data = data;
    }
    output.errorCod = 0;
    return this.out(200, output);
  }

  static okGeneric(message:string, errorCod:number, data?: any) {
    const output = new Output();

    output.message = message;
    if (typeof data === 'object') {
      if (data != null) output.data = data;
    }
    output.errorCod = errorCod;
    return this.out(200, output);
  }

  /* error en validaciones*/
  static errorValidaciones(data?: any, tipoError?: number[]) {
    const output = new Output();
    output.message = "Una o mas políticas no se cumplieron";
    output.success = false;
    
    if (typeof data === 'object') {
      if (data != null) output.data = data;
    }

    if (tipoError.length > 0) 
      output.errorCod = tipoError[0];
    else
      output.errorCod = 7045;
    
    return this.out(200, output);
  }

  static internalError(message: string = 'There are some errors.', data?: any) {
    const output = new Output();

    output.success = false;

    if (message) output.message = message;
    if (data) output.data = data;
    output.errorCod = 600;
    return this.out(500, output);
  }

  static genericError(message: string, success:boolean, status: number, code: number, data?: any) {
    const output = new Output();

    output.success = success;
    output.message = message;

    if (data) output.data = data;
    output.errorCod = code;
    return this.out(status, output);
  }

  static error(message: string, data?: any) {
    const output = new Output();

    output.success = false;
    output.message = message;

    if (data) output.data = data;
    output.errorCod = 600;
    return this.out(400, output);
  }

  static badRequest(constraints: { [type: string]: string }[]) {
    const output = new Output();

    output.success = false;
    output.message = 'The input is invalid.';
    output.data = constraints;
    output.errorCod = 600;
    return this.out(400, output);
  }

  static badRequestCifinInformation(message: string = 'Ok', data?: any) {
    const output = new Output();
    
    output.success = false;
    output.message = message;
      if (data != null) output.data = data;
    output.errorCod = 600;
    return this.out(400, output);
}

  static unauthorized() {
    const output = new Output();

    output.success = false;
    output.errorCod = 600;
    return this.out(401, output);
  }

}