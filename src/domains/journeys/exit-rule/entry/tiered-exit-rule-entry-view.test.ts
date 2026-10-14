import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredExitRuleEntryView, toTieredExitRuleEntryViews } from "./tiered-exit-rule-entry-view.js";
import { newTieredExitRuleEntry } from "./tiered-exit-rule-entry.js";

test("TieredExitRuleEntryView shows the status in capitals", () => {
  const item = newTieredExitRuleEntry("code-480", "title-897");
  const view = toTieredExitRuleEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredExitRuleEntryViews([item, item]).length, 2, "views");
});
