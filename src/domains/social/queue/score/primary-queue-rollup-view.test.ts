import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryQueueRollupView, toPrimaryQueueRollupViews } from "./primary-queue-rollup-view.js";
import { newPrimaryQueueRollup } from "./primary-queue-rollup.js";

test("PrimaryQueueRollupView shows the status in capitals", () => {
  const item = newPrimaryQueueRollup("code-580", "title-442");
  const view = toPrimaryQueueRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryQueueRollupViews([item, item]).length, 2, "views");
});
