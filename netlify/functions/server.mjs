import { reqHandler } from '../../dist/garden/server/server.mjs';

export const handler = async (event, context) => {
  const request = {
    method: event.httpMethod,
    url: event.path + (event.rawQuery ? `?${event.rawQuery}` : ''),
    headers: event.headers,
    body: event.body,
  };

  return await reqHandler(request);
};
