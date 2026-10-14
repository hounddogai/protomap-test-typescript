import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryRewardVarianceView, toPrimaryRewardVarianceViews } from "./primary-reward-variance-view.js";
import { newPrimaryRewardVariance } from "./primary-reward-variance.js";

test("PrimaryRewardVarianceView shows the status in capitals", () => {
  const item = newPrimaryRewardVariance("code-634", "label-238");
  const view = toPrimaryRewardVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryRewardVarianceViews([item, item]).length, 2, "views");
});
