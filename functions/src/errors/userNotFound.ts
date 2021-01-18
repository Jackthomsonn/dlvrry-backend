export class UserNotFound extends Error {
  constructor() {
    super();
    this.name = 'UserNotFound';
    this.message = 'User Not Found';
  }
}
