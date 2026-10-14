import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardVarianceView, toRewardVarianceViews } from "./reward-variance-view.js";
import { newRewardVariance } from "./reward-variance.js";

test("RewardVarianceView shows the status in capitals", () => {
  const item = newRewardVariance("code-918", "label-566");
  const view = toRewardVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardVarianceViews([item, item]).length, 2, "views");
});
