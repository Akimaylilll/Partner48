import { Tools } from "../utils";

export default class Headers {
	public static readonly POCKET_HEADER = {
		'Content-Type': 'application/json;charset=utf-8',
		appInfo: JSON.stringify({
			vendor: 'apple',
			deviceId: `${Tools.rStr(8)}-${Tools.rStr(4)}-${Tools.rStr(4)}-${Tools.rStr(4)}-${Tools.rStr(12)}`,
			appVersion: '6.2.2',
			appBuild: '21080401',
			osVersion: '11.4.1',
			osType: 'ios',
			deviceName: 'iPhone XR',
			os: 'ios'
		}),
		'User-Agent': 'PocketFans201807/6.0.16 (iPhone; iOS 13.5.1; Scale/2.00)',
		'Accept-Language': 'zh-Hans-AW;q=1',
		Host: 'pocketapi.48.cn'
	};
}