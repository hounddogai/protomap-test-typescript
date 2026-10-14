import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedInviteManifestView, toWeightedInviteManifestViews } from "./weighted-invite-manifest-view.js";
import { newWeightedInviteManifest } from "./weighted-invite-manifest.js";

test("WeightedInviteManifestView shows the status in capitals", () => {
  const item = newWeightedInviteManifest("code-246", "name-349");
  const view = toWeightedInviteManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedInviteManifestViews([item, item]).length, 2, "views");
});
