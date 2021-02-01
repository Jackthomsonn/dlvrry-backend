export class KeyNotFound extends Error {
  status: number = 404;

  constructor() {
    super();
    this.name = 'KeyNotFound';
    this.message = 'Key not found ';
  }
}
