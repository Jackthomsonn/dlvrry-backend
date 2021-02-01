export class Unauthorized extends Error {
  status: number = 401;

  constructor() {
    super();
    this.name = 'Unauthorized';
    this.message = 'You are not authorized to perform this action';
  }
}
