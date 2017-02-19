"use strict";
var Koa = require("koa");
var IO = require("koa-socket");
var app = new Koa();
var io = new IO();
io.attach(app);
io.on('join', function (_, data) {
    console.log('join event fired', data);
});
app.listen(process.env.PORT || 3001);
//# sourceMappingURL=main.js.map