import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingBounceRequestView, toRollingBounceRequestViews } from "./rolling-bounce-request-view.js";
import { newRollingBounceRequest } from "./rolling-bounce-request.js";

test("RollingBounceRequestView shows the status in capitals", () => {
  const item = newRollingBounceRequest("code-132", "label-451");
  const view = toRollingBounceRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingBounceRequestViews([item, item]).length, 2, "views");
});
