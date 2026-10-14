import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierDigestView, toTierDigestViews } from "./tier-digest-view.js";
import { newTierDigest } from "./tier-digest.js";

test("TierDigestView shows the status in capitals", () => {
  const item = newTierDigest("code-507", "label-893");
  const view = toTierDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierDigestViews([item, item]).length, 2, "views");
});
