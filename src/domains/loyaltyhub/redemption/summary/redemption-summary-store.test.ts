import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionSummaryStore } from "./redemption-summary-store.js";
import { newRedemptionSummary } from "./redemption-summary.js";

test("MemoryRedemptionSummaryStore finds what it saved", () => {
  const store = newMemoryRedemptionSummaryStore();
  const item = newRedemptionSummary("code-679", "title-946");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
