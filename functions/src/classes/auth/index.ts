export abstract class Auth<T, U> {
  abstract verify(request: U, meta: any): T;
}