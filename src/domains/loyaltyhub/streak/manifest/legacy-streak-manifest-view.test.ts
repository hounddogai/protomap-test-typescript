import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyStreakManifestView, toLegacyStreakManifestViews } from "./legacy-streak-manifest-view.js";
import { newLegacyStreakManifest } from "./legacy-streak-manifest.js";

test("LegacyStreakManifestView shows the status in capitals", () => {
  const item = newLegacyStreakManifest("code-820", "label-576");
  const view = toLegacyStreakManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyStreakManifestViews([item, item]).length, 2, "views");
});
