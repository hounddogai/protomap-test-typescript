import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyTierView, toFrequencyTierViews } from "./frequency-tier-view.js";
import { newFrequencyTier } from "./frequency-tier.js";

test("FrequencyTierView shows the status in capitals", () => {
  const item = newFrequencyTier("code-333", "label-73");
  const view = toFrequencyTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyTierViews([item, item]).length, 2, "views");
});
