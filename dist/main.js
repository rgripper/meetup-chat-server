"use strict";
var _this = this;
var koa = require("koa");
var app = new koa();
app.use(function () { return _this.body = 'Hello World'; });
app.listen(3000);
//# sourceMappingURL=main.js.map