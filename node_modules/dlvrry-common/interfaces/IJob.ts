import * as admin from 'firebase-admin';

import { JobStatus } from '../enums/job_status';

export interface IJob {
  id?: string;
  owner_name: string;
  owner_id: string;
  rider_id: string;
  customer_location: admin.firestore.GeoPoint;
  pickup_location: admin.firestore.GeoPoint;
  number_of_items: number;
  payout: number;
  cost: number;
  status?: JobStatus;
  charge_id?: string;
  payment_captured: boolean;
}
