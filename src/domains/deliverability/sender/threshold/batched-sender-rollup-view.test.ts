import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedSenderRollupView, toBatchedSenderRollupViews } from "./batched-sender-rollup-view.js";
import { newBatchedSenderRollup } from "./batched-sender-rollup.js";

test("BatchedSenderRollupView shows the status in capitals", () => {
  const item = newBatchedSenderRollup("code-667", "label-530");
  const view = toBatchedSenderRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedSenderRollupViews([item, item]).length, 2, "views");
});
