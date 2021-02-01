export class JobTaken extends Error {
  status: number = 400;

  constructor() {
    super();
    this.name = 'JobTaken';
    this.message = 'This job has been taken';
  }
}
