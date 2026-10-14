import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredEscalationRecordView, toTieredEscalationRecordViews } from "./tiered-escalation-record-view.js";
import { newTieredEscalationRecord } from "./tiered-escalation-record.js";

test("TieredEscalationRecordView shows the status in capitals", () => {
  const item = newTieredEscalationRecord("code-443", "name-70");
  const view = toTieredEscalationRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredEscalationRecordViews([item, item]).length, 2, "views");
});
