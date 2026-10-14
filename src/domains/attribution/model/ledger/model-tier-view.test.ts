import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelTierView, toModelTierViews } from "./model-tier-view.js";
import { newModelTier } from "./model-tier.js";

test("ModelTierView shows the status in capitals", () => {
  const item = newModelTier("code-602", "name-225");
  const view = toModelTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelTierViews([item, item]).length, 2, "views");
});
