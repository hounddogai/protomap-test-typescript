import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleRecordView, toExitRuleRecordViews } from "./exit-rule-record-view.js";
import { newExitRuleRecord } from "./exit-rule-record.js";

test("ExitRuleRecordView shows the status in capitals", () => {
  const item = newExitRuleRecord("code-278", "label-207");
  const view = toExitRuleRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleRecordViews([item, item]).length, 2, "views");
});
