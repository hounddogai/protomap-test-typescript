import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPathBatchView, toLegacyPathBatchViews } from "./legacy-path-batch-view.js";
import { newLegacyPathBatch } from "./legacy-path-batch.js";

test("LegacyPathBatchView shows the status in capitals", () => {
  const item = newLegacyPathBatch("code-20", "name-264");
  const view = toLegacyPathBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPathBatchViews([item, item]).length, 2, "views");
});
