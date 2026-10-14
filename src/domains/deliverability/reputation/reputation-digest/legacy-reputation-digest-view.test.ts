import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyReputationDigestView, toLegacyReputationDigestViews } from "./legacy-reputation-digest-view.js";
import { newLegacyReputationDigest } from "./legacy-reputation-digest.js";

test("LegacyReputationDigestView shows the status in capitals", () => {
  const item = newLegacyReputationDigest("code-830", "label-59");
  const view = toLegacyReputationDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyReputationDigestViews([item, item]).length, 2, "views");
});
