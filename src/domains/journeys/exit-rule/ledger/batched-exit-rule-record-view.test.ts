import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedExitRuleRecordView, toBatchedExitRuleRecordViews } from "./batched-exit-rule-record-view.js";
import { newBatchedExitRuleRecord } from "./batched-exit-rule-record.js";

test("BatchedExitRuleRecordView shows the status in capitals", () => {
  const item = newBatchedExitRuleRecord("code-58", "label-836");
  const view = toBatchedExitRuleRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedExitRuleRecordViews([item, item]).length, 2, "views");
});
