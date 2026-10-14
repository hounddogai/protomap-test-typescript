import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierManifestView, toTierManifestViews } from "./tier-manifest-view.js";
import { newTierManifest } from "./tier-manifest.js";

test("TierManifestView shows the status in capitals", () => {
  const item = newTierManifest("code-861", "name-430");
  const view = toTierManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierManifestViews([item, item]).length, 2, "views");
});
