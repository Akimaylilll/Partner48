<script setup lang="ts">
import { onMounted, nextTick } from 'vue';

onMounted(() => {
  nextTick(() => {
    drawStars(1300);
  });
  window.onresize = () => {
    const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    drawStars(width < 1300 ? 1300 : width);
  }
});

//画星空背景
function drawStars(maxStars: number) {
	const canvas: any = document.getElementById('canvas') || null;
	if(!canvas) {
		return;
	}
	const stars: any[] = []; //保存所有星星
	var ctx = canvas.getContext('2d'),
		w = canvas.width = window.innerWidth,
		h = canvas.height = window.innerHeight,

		hue = 217, //色调色彩
		count = 0; //用于计算星星
		// maxStars = 1300; //星星数量
  ctx.clearRect(0, 0, w, h);
	//canvas2是用来创建星星的源图像，即母版，
	//根据星星自身属性的大小来设置
	const canvas2: any = document.createElement('canvas') || null;
	if(!canvas2) {
		return;
	}
	var ctx2 = canvas2.getContext('2d');
	canvas2.width = 100;
	canvas2.height = 100;
  ctx2.clearRect(0, 0, w, h);
	//创建径向渐变，从坐标(half，half)半径为0的圆开始，
	//到坐标为(half,half)半径为half的圆结束
	var half = canvas2.width / 2,
		gradient2 = ctx2.createRadialGradient(half, half, 0, half, half, half);
	gradient2.addColorStop(0.025, '#CCC');
	//hsl是另一种颜色的表示方式，
	//h->hue,代表色调色彩，0为red，120为green，240为blue
	//s->saturation，代表饱和度，0%-100%
	//l->lightness，代表亮度，0%为black，100%位white
	gradient2.addColorStop(0.1, 'hsl(' + hue + ', 61%, 33%)');
	gradient2.addColorStop(0.25, 'hsl(' + hue + ', 64%, 6%)');
	gradient2.addColorStop(1, 'transparent');

	ctx2.fillStyle = gradient2;
	ctx2.beginPath();
	ctx2.arc(half, half, half, 0, Math.PI * 2);
	ctx2.fill();

	// End cache
	function random(min: number, max: number) {
		if (arguments.length < 2) {
			max = min;
			min = 0;
		}

		if (min > max) {
			var hold = max;
			max = min;
			min = hold;
		}

		//返回min和max之间的一个随机值
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function maxOrbit(x: number, y: number) {
		var max = Math.max(x, y),
			diameter = Math.round(Math.sqrt(max * max + max * max));
		//星星移动范围，值越大范围越小，
		return diameter / 2;
	}

	var Star = function() {
		//星星移动的半径
		this.orbitRadius = random(maxOrbit(w, h));
		//星星大小，半径越小，星星也越小，即外面的星星会比较大
		this.radius = random(60, this.orbitRadius) / 8;
		//所有星星都是以屏幕的中心为圆心
		this.orbitX = w / 2;
		this.orbitY = h / 2;
		//星星在旋转圆圈位置的角度,每次增加speed值的角度
		//利用正弦余弦算出真正的x、y位置
		this.timePassed = random(0, maxStars);
		//星星移动速度
		this.speed = random(this.orbitRadius) / 500000;
		//星星图像的透明度
		this.alpha = random(2, 10) / 10;

		count++;
		stars[count] = this;
	}

	Star.prototype.draw = function() {
		//星星围绕在以屏幕中心为圆心，半径为orbitRadius的圆旋转
		var x = Math.sin(this.timePassed) * this.orbitRadius + this.orbitX,
			y = Math.cos(this.timePassed) * this.orbitRadius + this.orbitY,
			twinkle = random(10);

		//星星每次移动会有1/10的几率变亮或者变暗
		if (twinkle === 1 && this.alpha > 0) {
			//透明度降低，变暗
			this.alpha -= 0.05;
		} else if (twinkle === 2 && this.alpha < 1) {
			//透明度升高，变亮
			this.alpha += 0.05;
		}

		ctx.globalAlpha = this.alpha;
		//使用canvas2作为源图像来创建星星，
		//位置在x - this.radius / 2, y - this.radius / 2
		//大小为 this.radius
		ctx.drawImage(canvas2, x - this.radius / 2, y - this.radius / 2, this.radius, this.radius);
		//没旋转一次，角度就会增加
		this.timePassed += this.speed;
	}

	//初始化所有星星
	for (var i = 0; i < maxStars; i++) {
		new Star();
	}

	function animation() {
		//以新图像覆盖已有图像的方式进行绘制背景颜色
		ctx.globalCompositeOperation = 'source-over';
		ctx.globalAlpha = 0.5; //尾巴
		ctx.fillStyle = 'hsla(' + hue + ', 64%, 6%, 2)';
		ctx.fillRect(0, 0, w, h)

		//源图像和目标图像同时显示，重叠部分叠加颜色效果
		ctx.globalCompositeOperation = 'lighter';
		for (var i = 1, l = stars.length; i < l; i++) {
			stars[i].draw();
		};

		//调用该方法执行动画，并且在重绘的时候调用指定的函数来更新动画
		//回调的次数通常是每秒60次
		window.requestAnimationFrame(animation);
	}

	animation();
}
</script>

<template>
  <canvas id="canvas" class="canvas"></canvas>
</template>

<style scoped lang="less">
.canvas {
	position: absolute;
	top: 0%;
	left: 0%;
	width: 100%;
	height: 100%;
	filter: alpha(opacity=20);
}
</style>
