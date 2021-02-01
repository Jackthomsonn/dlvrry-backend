export class UserNotFound extends Error {
  status: number = 404;

  constructor() {
    super();
    this.name = 'UserNotFound';
    this.message = 'User not found';
  }
}
