import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueMappingView, toQueueMappingViews } from "./queue-mapping-view.js";
import { newQueueMapping } from "./queue-mapping.js";

test("QueueMappingView shows the status in capitals", () => {
  const item = newQueueMapping("code-23", "label-524");
  const view = toQueueMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueMappingViews([item, item]).length, 2, "views");
});
