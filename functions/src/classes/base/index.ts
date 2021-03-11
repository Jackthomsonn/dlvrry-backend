import * as admin from 'firebase-admin';

export class Base<T> {
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

  query(query: { field: string, operation: FirebaseFirestore.WhereFilterOp, value: string }): Promise<FirebaseFirestore.QuerySnapshot<T>> {
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
      .update(data);
  }

  remove(id: string): Promise<FirebaseFirestore.WriteResult> {
    return admin
      .firestore()
      .collection(this.collectionName)
      .doc(id)
      .delete();
  }
}