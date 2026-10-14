import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalEscalationRecordView, toGlobalEscalationRecordViews } from "./global-escalation-record-view.js";
import { newGlobalEscalationRecord } from "./global-escalation-record.js";

test("GlobalEscalationRecordView shows the status in capitals", () => {
  const item = newGlobalEscalationRecord("code-413", "name-343");
  const view = toGlobalEscalationRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalEscalationRecordViews([item, item]).length, 2, "views");
});
