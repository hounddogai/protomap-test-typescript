import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalRewardTargetView, toGlobalRewardTargetViews } from "./global-reward-target-view.js";
import { newGlobalRewardTarget } from "./global-reward-target.js";

test("GlobalRewardTargetView shows the status in capitals", () => {
  const item = newGlobalRewardTarget("code-396", "name-28");
  const view = toGlobalRewardTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalRewardTargetViews([item, item]).length, 2, "views");
});
