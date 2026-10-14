import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryEscalationBatchView, toPrimaryEscalationBatchViews } from "./primary-escalation-batch-view.js";
import { newPrimaryEscalationBatch } from "./primary-escalation-batch.js";

test("PrimaryEscalationBatchView shows the status in capitals", () => {
  const item = newPrimaryEscalationBatch("code-289", "title-235");
  const view = toPrimaryEscalationBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryEscalationBatchViews([item, item]).length, 2, "views");
});
