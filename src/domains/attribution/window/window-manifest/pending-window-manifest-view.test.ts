import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingWindowManifestView, toPendingWindowManifestViews } from "./pending-window-manifest-view.js";
import { newPendingWindowManifest } from "./pending-window-manifest.js";

test("PendingWindowManifestView shows the status in capitals", () => {
  const item = newPendingWindowManifest("code-137", "title-665");
  const view = toPendingWindowManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingWindowManifestViews([item, item]).length, 2, "views");
});
