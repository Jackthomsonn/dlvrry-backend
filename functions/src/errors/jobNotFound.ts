export class JobNotFound extends Error {
  status: number = 404;

  constructor() {
    super();
    this.name = 'JobNotFound';
    this.message = 'Job not found';
  }
}
