import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedCreditOverrideView, toBatchedCreditOverrideViews } from "./batched-credit-override-view.js";
import { newBatchedCreditOverride } from "./batched-credit-override.js";

test("BatchedCreditOverrideView shows the status in capitals", () => {
  const item = newBatchedCreditOverride("code-12", "label-254");
  const view = toBatchedCreditOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedCreditOverrideViews([item, item]).length, 2, "views");
});
