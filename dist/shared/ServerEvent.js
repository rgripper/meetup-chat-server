"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ServerEventType;
(function (ServerEventType) {
    ServerEventType[ServerEventType["UserLeft"] = 0] = "UserLeft";
    ServerEventType[ServerEventType["UserJoined"] = 1] = "UserJoined";
    ServerEventType[ServerEventType["MessageAdded"] = 2] = "MessageAdded";
    ServerEventType[ServerEventType["LoginSuccessful"] = 3] = "LoginSuccessful";
    ServerEventType[ServerEventType["LoginFailed"] = 4] = "LoginFailed";
})(ServerEventType = exports.ServerEventType || (exports.ServerEventType = {}));
//# sourceMappingURL=ServerEvent.js.map