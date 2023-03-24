import { GotRequest } from "../utils";
import Apis from "./apis";

export class Pocket {
  private gotRequest: GotRequest = null;
  constructor() {
    this.gotRequest = new GotRequest();
  }

  public async getLiveList(isLive: boolean, next: string) {
    const data = {
			next,
			loadMore: "true",
			userId: "0",
			teamId: "0",
			groupId: "0",
			record: isLive ? "false" : "true"
		};
    const result: any = await this.gotRequest.request(
      Apis.LIVE_LIST_URL,
      data
    );
    if(result.body.status === 200){
      return result.body.content;
    }
    return {};
  }

  public async getOneLiveById(liveId: string) {
    const data = {
      "type": 1,
      "userId": "0",
      "liveId": liveId
    };
    const result: any = await this.gotRequest.request(
      Apis.LIVE_ONE_URL,
      data
    );
    if(result.body.status === 200){
      return result.body.content;
    }
    return {};
  }
}