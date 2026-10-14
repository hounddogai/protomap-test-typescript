import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalTierManifestView, toRegionalTierManifestViews } from "./regional-tier-manifest-view.js";
import { newRegionalTierManifest } from "./regional-tier-manifest.js";

test("RegionalTierManifestView shows the status in capitals", () => {
  const item = newRegionalTierManifest("code-831", "label-984");
  const view = toRegionalTierManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalTierManifestViews([item, item]).length, 2, "views");
});
