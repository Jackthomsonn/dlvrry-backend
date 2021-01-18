export class InvalidSignature extends Error {
  constructor() {
    super();
    this.name = 'InvalidSignature';
    this.message = 'The signature provided was incorrect';
  }
}
