import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedBadgeDigestView, toCappedBadgeDigestViews } from "./capped-badge-digest-view.js";
import { newCappedBadgeDigest } from "./capped-badge-digest.js";

test("CappedBadgeDigestView shows the status in capitals", () => {
  const item = newCappedBadgeDigest("code-142", "name-697");
  const view = toCappedBadgeDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedBadgeDigestViews([item, item]).length, 2, "views");
});
