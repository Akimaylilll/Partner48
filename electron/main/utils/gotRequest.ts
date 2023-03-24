import got from "got";
import Headers from "../pocket/headers";

export class GotRequest {
  constructor() {

  }

  public async request(url:string, body:Object) {
    return await got(url, {
      method: 'POST',
      headers: Headers.POCKET_HEADER,
      responseType: 'json',
      json: body,
      timeout: { request: 60_000 }
    });
  }
}