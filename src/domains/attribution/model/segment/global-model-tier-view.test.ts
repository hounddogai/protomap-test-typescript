import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalModelTierView, toGlobalModelTierViews } from "./global-model-tier-view.js";
import { newGlobalModelTier } from "./global-model-tier.js";

test("GlobalModelTierView shows the status in capitals", () => {
  const item = newGlobalModelTier("code-947", "name-97");
  const view = toGlobalModelTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalModelTierViews([item, item]).length, 2, "views");
});
