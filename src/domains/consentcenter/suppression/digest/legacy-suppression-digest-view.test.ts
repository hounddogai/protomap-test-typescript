import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacySuppressionDigestView, toLegacySuppressionDigestViews } from "./legacy-suppression-digest-view.js";
import { newLegacySuppressionDigest } from "./legacy-suppression-digest.js";

test("LegacySuppressionDigestView shows the status in capitals", () => {
  const item = newLegacySuppressionDigest("code-326", "label-531");
  const view = toLegacySuppressionDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacySuppressionDigestViews([item, item]).length, 2, "views");
});
