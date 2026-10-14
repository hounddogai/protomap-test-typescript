import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedRetentionTierView, toBatchedRetentionTierViews } from "./batched-retention-tier-view.js";
import { newBatchedRetentionTier } from "./batched-retention-tier.js";

test("BatchedRetentionTierView shows the status in capitals", () => {
  const item = newBatchedRetentionTier("code-925", "name-840");
  const view = toBatchedRetentionTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedRetentionTierViews([item, item]).length, 2, "views");
});
