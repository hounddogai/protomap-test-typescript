import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalProofManifestView, toSeasonalProofManifestViews } from "./seasonal-proof-manifest-view.js";
import { newSeasonalProofManifest } from "./seasonal-proof-manifest.js";

test("SeasonalProofManifestView shows the status in capitals", () => {
  const item = newSeasonalProofManifest("code-385", "name-392");
  const view = toSeasonalProofManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalProofManifestViews([item, item]).length, 2, "views");
});
