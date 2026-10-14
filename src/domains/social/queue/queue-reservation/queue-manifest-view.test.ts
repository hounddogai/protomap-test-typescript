import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueManifestView, toQueueManifestViews } from "./queue-manifest-view.js";
import { newQueueManifest } from "./queue-manifest.js";

test("QueueManifestView shows the status in capitals", () => {
  const item = newQueueManifest("code-304", "name-175");
  const view = toQueueManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueManifestViews([item, item]).length, 2, "views");
});
