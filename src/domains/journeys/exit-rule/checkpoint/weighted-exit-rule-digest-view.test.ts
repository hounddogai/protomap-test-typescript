import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedExitRuleDigestView, toWeightedExitRuleDigestViews } from "./weighted-exit-rule-digest-view.js";
import { newWeightedExitRuleDigest } from "./weighted-exit-rule-digest.js";

test("WeightedExitRuleDigestView shows the status in capitals", () => {
  const item = newWeightedExitRuleDigest("code-75", "title-151");
  const view = toWeightedExitRuleDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedExitRuleDigestViews([item, item]).length, 2, "views");
});
