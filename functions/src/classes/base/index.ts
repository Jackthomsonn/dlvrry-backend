import * as admin from 'firebase-admin';

export class Crud<T> {
  constructor(private collectionName: string) { }

  save(data: T) {
    const docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData> = admin
      .firestore()
      .collection(this.collectionName)
      .doc();

    return docRef.create(data);
  }

  get(id: string): Promise<FirebaseFirestore.DocumentSnapshot<T>> {
    return <Promise<FirebaseFirestore.DocumentSnapshot<T>>>admin
      .firestore()
      .collection(this.collectionName)
      .doc(id)
      .get();
  }

  getWhere(query: { field: string, operation: FirebaseFirestore.WhereFilterOp, value: string }): Promise<FirebaseFirestore.QuerySnapshot<T>> {
    return <Promise<FirebaseFirestore.QuerySnapshot<T>>>admin
      .firestore()
      .collection(this.collectionName)
      .where(query.field, query.operation, query.value)
      .get()
  }

  list(): Promise<FirebaseFirestore.QuerySnapshot<T>> {
    return <Promise<FirebaseFirestore.QuerySnapshot<T>>>admin
      .firestore()
      .collection(this.collectionName)
      .get()
  }

  update(id: string, data: Partial<T>): Promise<admin.firestore.WriteResult> {
    return admin
      .firestore()
      .collection(this.collectionName)
      .doc(id)
      .set(data, { merge: true });
  }

  async updateWhere(query: { field: string, operation: FirebaseFirestore.WhereFilterOp, value?: string }, data: Partial<T>): Promise<void> {
    const doc = await admin
      .firestore()
      .collection(this.collectionName)
      .where(query.field, query.operation, query.value)
      .get();

    for (const document of doc.docs) {
      await document.ref.set(data, { merge: true });
    }

    return Promise.resolve();
  }

  remove(id: string): Promise<FirebaseFirestore.WriteResult> {
    return admin
      .firestore()
      .collection(this.collectionName)
      .doc(id)
      .delete();
  }
}