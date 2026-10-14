import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeBatchView, toBadgeBatchViews } from "./badge-batch-view.js";
import { newBadgeBatch } from "./badge-batch.js";

test("BadgeBatchView shows the status in capitals", () => {
  const item = newBadgeBatch("code-906", "name-468");
  const view = toBadgeBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeBatchViews([item, item]).length, 2, "views");
});
