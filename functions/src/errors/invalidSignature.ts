export class InvalidSignature extends Error {
  status: number = 401;

  constructor() {
    super();
    this.name = 'InvalidSignature';
    this.message = 'The signature provided was incorrect';
  }
}
