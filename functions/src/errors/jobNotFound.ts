export class JobNotFound extends Error {
  constructor() {
    super();
    this.name = 'JobNotFound';
    this.message = 'Job not found';
  }
}
