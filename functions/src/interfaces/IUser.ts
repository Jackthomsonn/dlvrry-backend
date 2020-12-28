import { Role } from './../enums/role/index';

export interface IUser {
  readonly id: string;
  name: string;
  email: string;
  role: Role,
  stripeAccountId: string;
  accountLinkUrl: string;
  customerId: string;
}
