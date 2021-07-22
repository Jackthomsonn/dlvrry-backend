export class UserNotVerified extends Error {
  status: number = 403;

  constructor() {
    super();
    this.name = "UserNotVerified";
    this.message = "This user has not been verified";
  }
}
