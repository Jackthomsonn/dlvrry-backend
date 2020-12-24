import * as admin from 'firebase-admin';

import { Status } from '../enums/status';

export interface IJob {
  readonly id: string;
  businessName: string;
  businessId: string;
  driverId: string;
  customerLocation: admin.firestore.GeoPoint;
  pickupLocation: admin.firestore.GeoPoint;
  numberOfItems: number;
  payout: number;
cost: number;
  status: Status;
}
