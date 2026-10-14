import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveRedemptionSummaryStore } from "./adaptive-redemption-summary-store.js";
import { newAdaptiveRedemptionSummary } from "./adaptive-redemption-summary.js";

test("MemoryAdaptiveRedemptionSummaryStore finds what it saved", () => {
  const store = newMemoryAdaptiveRedemptionSummaryStore();
  const item = newAdaptiveRedemptionSummary("code-624", "title-237");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
