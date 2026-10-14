import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleBatchView, toExitRuleBatchViews } from "./exit-rule-batch-view.js";
import { newExitRuleBatch } from "./exit-rule-batch.js";

test("ExitRuleBatchView shows the status in capitals", () => {
  const item = newExitRuleBatch("code-615", "name-210");
  const view = toExitRuleBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleBatchViews([item, item]).length, 2, "views");
});
