import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaBatchView, toSlaBatchViews } from "./sla-batch-view.js";
import { newSlaBatch } from "./sla-batch.js";

test("SlaBatchView shows the status in capitals", () => {
  const item = newSlaBatch("code-197", "title-269");
  const view = toSlaBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaBatchViews([item, item]).length, 2, "views");
});
