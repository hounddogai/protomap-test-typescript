import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleEntryView, toExitRuleEntryViews } from "./exit-rule-entry-view.js";
import { newExitRuleEntry } from "./exit-rule-entry.js";

test("ExitRuleEntryView shows the status in capitals", () => {
  const item = newExitRuleEntry("code-468", "label-257");
  const view = toExitRuleEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleEntryViews([item, item]).length, 2, "views");
});
