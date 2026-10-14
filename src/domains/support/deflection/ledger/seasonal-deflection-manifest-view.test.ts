import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalDeflectionManifestView,
  toSeasonalDeflectionManifestViews,
} from "./seasonal-deflection-manifest-view.js";
import { newSeasonalDeflectionManifest } from "./seasonal-deflection-manifest.js";

test("SeasonalDeflectionManifestView shows the status in capitals", () => {
  const item = newSeasonalDeflectionManifest("code-28", "title-277");
  const view = toSeasonalDeflectionManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalDeflectionManifestViews([item, item]).length, 2, "views");
});
