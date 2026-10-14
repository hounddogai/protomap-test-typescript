import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyRetentionDigestView, toLegacyRetentionDigestViews } from "./legacy-retention-digest-view.js";
import { newLegacyRetentionDigest } from "./legacy-retention-digest.js";

test("LegacyRetentionDigestView shows the status in capitals", () => {
  const item = newLegacyRetentionDigest("code-543", "title-631");
  const view = toLegacyRetentionDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyRetentionDigestViews([item, item]).length, 2, "views");
});
