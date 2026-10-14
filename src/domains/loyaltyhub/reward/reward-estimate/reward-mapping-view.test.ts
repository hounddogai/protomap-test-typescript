import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardMappingView, toRewardMappingViews } from "./reward-mapping-view.js";
import { newRewardMapping } from "./reward-mapping.js";

test("RewardMappingView shows the status in capitals", () => {
  const item = newRewardMapping("code-366", "name-182");
  const view = toRewardMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardMappingViews([item, item]).length, 2, "views");
});
