import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledFunnelManifestView, toScheduledFunnelManifestViews } from "./scheduled-funnel-manifest-view.js";
import { newScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

test("ScheduledFunnelManifestView shows the status in capitals", () => {
  const item = newScheduledFunnelManifest("code-247", "name-139");
  const view = toScheduledFunnelManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledFunnelManifestViews([item, item]).length, 2, "views");
});
