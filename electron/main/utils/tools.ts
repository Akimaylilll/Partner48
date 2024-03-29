import { execSync } from 'child_process';
import os from 'os';
import treeKill from 'tree-kill';
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
	/**
	 * 端口占用信息查询
	 */
	public static findPort(port) {
		const platform = os.platform();
		return new Promise((resolve, reject) => {
			if (platform === 'win32') {
				const order = `netstat -ano | findstr ${port}`;
				try {
					const stdout = execSync(order);
					const portInfo = stdout.toString().trim().split(/\s+/);
					const pId = portInfo[portInfo.length - 1];
					const processStdout = execSync(`tasklist | findstr  ${pId}`);
					const [pName] = processStdout.toString().trim().split(/\s+/);
					resolve({
						pId,
						pName,
					});
				} catch (error) {
					reject(error);
				}
			} else {
				const order = `lsof -i :${port}`;
				try {
					const stdout = execSync(order);
					const [pName, pId] = stdout
						.toString()
						.trim()
						.split(/\n/)[1]
						.split(/\s+/);
					resolve({
						pId,
						pName,
					});
				} catch (error) {
					reject(error);
				}
			}
		});
	}

	/**
	 * 占用端口关闭
	 */
	public static killPort(pid) {
		const platform = os.platform();
		return new Promise((resolve, reject) => {
			if (platform === 'win32') {
				const order = `taskkill /pid ${pid} -t -f`;
				try {
					const stdout = execSync(order);
					resolve({
						stdout
					});
				} catch (error) {
					reject(error);
				}
			} else {
				const order = `kill -KILL ${pid}`;
				try {
					const stdout = execSync(order);
					resolve({
						stdout
					});
				} catch (error) {
					reject(error);
				}
			}
		});
	}

	public static toSec(time: string | undefined) {
		if(!time) {
			return;
		}
		let s: number = 0;
		const hour: string = time.split(':')[0];
		const min: string = time.split(':')[1];
		const sec: string = time.split(':')[2];
		if(!hour || !min || !sec) {
			return;
		}
		s = Number(hour) * 3600 + Number(min) * 60 + Number(sec);
		return s;
	}

	public static sleep (time) {
		return new Promise(resolve => setTimeout(resolve, time))
	}

	public static killProcess(pid: number) {
		return new Promise((resolve,reject) => {
			treeKill(pid,'SIGKILL', function(err) {
				if(err) reject;
				resolve;
			});
		});
	}

}