export class Response {
  static success(data: any = {}) {
    return data;
  }

  static fail(error?: any) {
    return {
      status: error.status ? error.status : 500,
      message: error.message ? error.message : 'Internal Server Error'
    };

  }
}