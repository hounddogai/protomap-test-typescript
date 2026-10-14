import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingRewardRequestView, toRollingRewardRequestViews } from "./rolling-reward-request-view.js";
import { newRollingRewardRequest } from "./rolling-reward-request.js";

test("RollingRewardRequestView shows the status in capitals", () => {
  const item = newRollingRewardRequest("code-273", "label-794");
  const view = toRollingRewardRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingRewardRequestViews([item, item]).length, 2, "views");
});
