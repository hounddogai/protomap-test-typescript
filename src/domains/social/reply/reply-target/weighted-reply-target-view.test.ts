import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedReplyTargetView, toWeightedReplyTargetViews } from "./weighted-reply-target-view.js";
import { newWeightedReplyTarget } from "./weighted-reply-target.js";

test("WeightedReplyTargetView shows the status in capitals", () => {
  const item = newWeightedReplyTarget("code-671", "name-610");
  const view = toWeightedReplyTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedReplyTargetViews([item, item]).length, 2, "views");
});
