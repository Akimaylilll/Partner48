import Koa from "koa";
import bodyParser from "koa-body";
const port: number = 8173;

const app:Koa = new Koa();

app.use(bodyParser());

app.use((ctx: Koa.DefaultContext) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  ctx.body = {code: 0, data: []};
});

app.listen(port, () => {
    console.log(`seccess start server`)
    console.log(`local: http://127.0.0.1:${port}`)
});

