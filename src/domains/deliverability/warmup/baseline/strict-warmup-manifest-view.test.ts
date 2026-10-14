import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictWarmupManifestView, toStrictWarmupManifestViews } from "./strict-warmup-manifest-view.js";
import { newStrictWarmupManifest } from "./strict-warmup-manifest.js";

test("StrictWarmupManifestView shows the status in capitals", () => {
  const item = newStrictWarmupManifest("code-986", "title-754");
  const view = toStrictWarmupManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictWarmupManifestViews([item, item]).length, 2, "views");
});
