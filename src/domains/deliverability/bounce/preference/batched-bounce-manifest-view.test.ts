import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedBounceManifestView, toBatchedBounceManifestViews } from "./batched-bounce-manifest-view.js";
import { newBatchedBounceManifest } from "./batched-bounce-manifest.js";

test("BatchedBounceManifestView shows the status in capitals", () => {
  const item = newBatchedBounceManifest("code-586", "name-244");
  const view = toBatchedBounceManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedBounceManifestViews([item, item]).length, 2, "views");
});
