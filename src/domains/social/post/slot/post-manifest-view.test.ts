import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostManifestView, toPostManifestViews } from "./post-manifest-view.js";
import { newPostManifest } from "./post-manifest.js";

test("PostManifestView shows the status in capitals", () => {
  const item = newPostManifest("code-465", "title-923");
  const view = toPostManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostManifestViews([item, item]).length, 2, "views");
});
