import * as koa from 'koa';
const app = new koa();

app.use(() => this.body = 'Hello World');

app.listen(3000); //fff