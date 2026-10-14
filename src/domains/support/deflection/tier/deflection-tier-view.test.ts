import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionTierView, toDeflectionTierViews } from "./deflection-tier-view.js";
import { newDeflectionTier } from "./deflection-tier.js";

test("DeflectionTierView shows the status in capitals", () => {
  const item = newDeflectionTier("code-534", "title-395");
  const view = toDeflectionTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionTierViews([item, item]).length, 2, "views");
});
