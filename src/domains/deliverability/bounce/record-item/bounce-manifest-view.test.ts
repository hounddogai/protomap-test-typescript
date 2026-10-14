import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceManifestView, toBounceManifestViews } from "./bounce-manifest-view.js";
import { newBounceManifest } from "./bounce-manifest.js";

test("BounceManifestView shows the status in capitals", () => {
  const item = newBounceManifest("code-700", "name-939");
  const view = toBounceManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceManifestViews([item, item]).length, 2, "views");
});
