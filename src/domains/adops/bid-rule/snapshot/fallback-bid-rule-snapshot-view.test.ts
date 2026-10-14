import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackBidRuleSnapshotView, toFallbackBidRuleSnapshotViews } from "./fallback-bid-rule-snapshot-view.js";
import { newFallbackBidRuleSnapshot } from "./fallback-bid-rule-snapshot.js";

test("FallbackBidRuleSnapshotView shows the status in capitals", () => {
  const item = newFallbackBidRuleSnapshot("code-978", "name-32");
  const view = toFallbackBidRuleSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackBidRuleSnapshotViews([item, item]).length, 2, "views");
});
