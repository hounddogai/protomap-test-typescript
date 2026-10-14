import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualFunnelManifestView, toManualFunnelManifestViews } from "./manual-funnel-manifest-view.js";
import { newManualFunnelManifest } from "./manual-funnel-manifest.js";

test("ManualFunnelManifestView shows the status in capitals", () => {
  const item = newManualFunnelManifest("code-959", "name-996");
  const view = toManualFunnelManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualFunnelManifestViews([item, item]).length, 2, "views");
});
