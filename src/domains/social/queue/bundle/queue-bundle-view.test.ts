import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueBundleView, toQueueBundleViews } from "./queue-bundle-view.js";
import { newQueueBundle } from "./queue-bundle.js";

test("QueueBundleView shows the status in capitals", () => {
  const item = newQueueBundle("code-273", "title-36");
  const view = toQueueBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueBundleViews([item, item]).length, 2, "views");
});
