import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredModelDigestView, toTieredModelDigestViews } from "./tiered-model-digest-view.js";
import { newTieredModelDigest } from "./tiered-model-digest.js";

test("TieredModelDigestView shows the status in capitals", () => {
  const item = newTieredModelDigest("code-162", "label-38");
  const view = toTieredModelDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredModelDigestViews([item, item]).length, 2, "views");
});
