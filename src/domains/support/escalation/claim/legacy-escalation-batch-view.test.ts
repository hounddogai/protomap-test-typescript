import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyEscalationBatchView, toLegacyEscalationBatchViews } from "./legacy-escalation-batch-view.js";
import { newLegacyEscalationBatch } from "./legacy-escalation-batch.js";

test("LegacyEscalationBatchView shows the status in capitals", () => {
  const item = newLegacyEscalationBatch("code-628", "name-97");
  const view = toLegacyEscalationBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyEscalationBatchViews([item, item]).length, 2, "views");
});
