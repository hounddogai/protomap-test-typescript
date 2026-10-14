import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyManifestView, toJourneyManifestViews } from "./journey-manifest-view.js";
import { newJourneyManifest } from "./journey-manifest.js";

test("JourneyManifestView shows the status in capitals", () => {
  const item = newJourneyManifest("code-37", "name-959");
  const view = toJourneyManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyManifestViews([item, item]).length, 2, "views");
});
