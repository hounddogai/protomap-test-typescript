import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueDigestView, toQueueDigestViews } from "./queue-digest-view.js";
import { newQueueDigest } from "./queue-digest.js";

test("QueueDigestView shows the status in capitals", () => {
  const item = newQueueDigest("code-295", "label-183");
  const view = toQueueDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueDigestViews([item, item]).length, 2, "views");
});
