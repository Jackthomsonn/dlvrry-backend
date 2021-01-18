export class KeyNotFound extends Error {
  constructor() {
    super();
    this.name = 'KeyNotFound';
    this.message = 'Key Not Found ';
  }
}
