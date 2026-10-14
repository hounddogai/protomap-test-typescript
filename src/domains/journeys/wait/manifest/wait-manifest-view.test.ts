import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitManifestView, toWaitManifestViews } from "./wait-manifest-view.js";
import { newWaitManifest } from "./wait-manifest.js";

test("WaitManifestView shows the status in capitals", () => {
  const item = newWaitManifest("code-388", "title-699");
  const view = toWaitManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitManifestViews([item, item]).length, 2, "views");
});
