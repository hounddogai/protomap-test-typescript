import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBounceSummaryStore } from "./tiered-bounce-summary-store.js";
import { newTieredBounceSummary } from "./tiered-bounce-summary.js";

test("MemoryTieredBounceSummaryStore finds what it saved", () => {
  const store = newMemoryTieredBounceSummaryStore();
  const item = newTieredBounceSummary("code-72", "name-930");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
