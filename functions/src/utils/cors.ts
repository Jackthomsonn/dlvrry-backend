import * as functions from 'firebase-functions';

export const handleCors = (response: functions.Response) => {
  response.set('Access-Control-Allow-Methods', 'POST');
  response.set('Access-Control-Max-Age', '3600');
  response.status(204).send('');
}
