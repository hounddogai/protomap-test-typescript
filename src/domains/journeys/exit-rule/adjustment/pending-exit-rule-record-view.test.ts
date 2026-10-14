import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingExitRuleRecordView, toPendingExitRuleRecordViews } from "./pending-exit-rule-record-view.js";
import { newPendingExitRuleRecord } from "./pending-exit-rule-record.js";

test("PendingExitRuleRecordView shows the status in capitals", () => {
  const item = newPendingExitRuleRecord("code-787", "name-819");
  const view = toPendingExitRuleRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingExitRuleRecordViews([item, item]).length, 2, "views");
});
