import * as Koa from 'koa';
import * as IO from 'koa-socket';

const app = new Koa()
const io = new IO()

io.attach( app )

io.on('join', ( _, data ) => {
  console.log( 'join event fired', data )
})

app.listen( process.env.PORT || 3000);