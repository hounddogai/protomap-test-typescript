import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedCreditCheckpointView, toCappedCreditCheckpointViews } from "./capped-credit-checkpoint-view.js";
import { newCappedCreditCheckpoint } from "./capped-credit-checkpoint.js";

test("CappedCreditCheckpointView shows the status in capitals", () => {
  const item = newCappedCreditCheckpoint("code-698", "name-274");
  const view = toCappedCreditCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedCreditCheckpointViews([item, item]).length, 2, "views");
});
