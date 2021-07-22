export class RiderSuspended extends Error {
  status: number = 403;

  constructor() {
    super();
    this.name = "RiderSuspended";
    this.message = "This user has been suspended";
  }
}
