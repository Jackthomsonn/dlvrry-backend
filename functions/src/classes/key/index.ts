import * as admin from 'firebase-admin';
import * as moment from 'moment';

import { createHmac, timingSafeEqual } from 'crypto';

import { IKey } from 'dlvrry-common';
import { InvalidSignature } from './../../errors/invalidSignature';
import { Job } from '../job';
import { KeyNotFound } from './../../errors/keyNotFound';

export class Key implements IKey {
  constructor(
    readonly key: string,
    readonly id?: string
  ) { }

  static getConverter() {
    return {
      toFirestore({ key, id }: Key): admin.firestore.DocumentData {
        return { key, id };
      },
      fromFirestore(
        snapshot: admin.firestore.QueryDocumentSnapshot<Key>
      ): Key {
        const { key, id } = snapshot.data();

        return new Key(key, id);
      },
    }
  }

  static getKey(id: string): Promise<FirebaseFirestore.DocumentSnapshot<Key>> {
    return admin
      .firestore()
      .collection('keys')
      .withConverter(this.getConverter())
      .doc(id)
      .get();
  }

  static updateKey(id: string, newKey: Partial<IKey>): Promise<admin.firestore.WriteResult> {
    return admin
      .firestore()
      .collection('keys')
      .doc(id)
      .update(newKey);
  }

  static createKey(key: IKey): Promise<admin.firestore.WriteResult> {
    return admin
      .firestore()
      .collection('keys')
      .withConverter(this.getConverter())
      .doc()
      .create(key);
  }

  static async validateKey(body: any): Promise<any> {
    const keyResponse = await admin
      .firestore()
      .collection('keys')
      .withConverter(this.getConverter())
      .doc(body.platform_id)
      .get();

    const keyData = keyResponse.data();

    if (!keyData) {
      throw new KeyNotFound();
    }

    const data = { ...body.job, timestamp: body.timestamp };

    const computedHmac = createHmac('sha512', keyData.key).update(JSON.stringify(data)).digest('hex');

    timingSafeEqual(Buffer.from(computedHmac, 'utf8'), Buffer.from(body.token, 'utf8'));

    if (computedHmac !== body.token || moment().diff(body.timestamp, 'seconds') > 10) {
      throw new InvalidSignature();
    } else {
      await Job.createJob(body.job, body.job.owner_id);

      return Promise.resolve();
    }
  }
}