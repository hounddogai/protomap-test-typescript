import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationBatchView, toActivationBatchViews } from "./activation-batch-view.js";
import { newActivationBatch } from "./activation-batch.js";

test("ActivationBatchView shows the status in capitals", () => {
  const item = newActivationBatch("code-399", "label-786");
  const view = toActivationBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationBatchViews([item, item]).length, 2, "views");
});
