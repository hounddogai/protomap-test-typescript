import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBounceOverrideView, toTieredBounceOverrideViews } from "./tiered-bounce-override-view.js";
import { newTieredBounceOverride } from "./tiered-bounce-override.js";

test("TieredBounceOverrideView shows the status in capitals", () => {
  const item = newTieredBounceOverride("code-190", "name-383");
  const view = toTieredBounceOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBounceOverrideViews([item, item]).length, 2, "views");
});
