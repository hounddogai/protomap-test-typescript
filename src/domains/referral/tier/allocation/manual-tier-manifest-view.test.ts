import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualTierManifestView, toManualTierManifestViews } from "./manual-tier-manifest-view.js";
import { newManualTierManifest } from "./manual-tier-manifest.js";

test("ManualTierManifestView shows the status in capitals", () => {
  const item = newManualTierManifest("code-436", "label-103");
  const view = toManualTierManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualTierManifestViews([item, item]).length, 2, "views");
});
