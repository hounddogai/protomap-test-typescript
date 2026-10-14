import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredPathDigestView, toTieredPathDigestViews } from "./tiered-path-digest-view.js";
import { newTieredPathDigest } from "./tiered-path-digest.js";

test("TieredPathDigestView shows the status in capitals", () => {
  const item = newTieredPathDigest("code-167", "name-256");
  const view = toTieredPathDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredPathDigestViews([item, item]).length, 2, "views");
});
