export class Tools {
	/* 随机字符串 */
	public static rStr(len: number): string {
		const str: string = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890';
		let result: string = '';

		for (let i: number = 0; i < len; i++) {
			const rIndex: number = Math.floor(Math.random() * str.length);

			result += str[rIndex];
		}

		return result;
	}
}