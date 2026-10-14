import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultModelTierView, toDefaultModelTierViews } from "./default-model-tier-view.js";
import { newDefaultModelTier } from "./default-model-tier.js";

test("DefaultModelTierView shows the status in capitals", () => {
  const item = newDefaultModelTier("code-948", "label-249");
  const view = toDefaultModelTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultModelTierViews([item, item]).length, 2, "views");
});
