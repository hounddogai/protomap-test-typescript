import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleCheckpointView, toBidRuleCheckpointViews } from "./bid-rule-checkpoint-view.js";
import { newBidRuleCheckpoint } from "./bid-rule-checkpoint.js";

test("BidRuleCheckpointView shows the status in capitals", () => {
  const item = newBidRuleCheckpoint("code-484", "label-535");
  const view = toBidRuleCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleCheckpointViews([item, item]).length, 2, "views");
});
