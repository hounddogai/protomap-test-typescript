import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionTierView, toConversionTierViews } from "./conversion-tier-view.js";
import { newConversionTier } from "./conversion-tier.js";

test("ConversionTierView shows the status in capitals", () => {
  const item = newConversionTier("code-945", "title-377");
  const view = toConversionTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionTierViews([item, item]).length, 2, "views");
});
