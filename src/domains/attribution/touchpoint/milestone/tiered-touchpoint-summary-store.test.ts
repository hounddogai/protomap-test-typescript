import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredTouchpointSummaryStore } from "./tiered-touchpoint-summary-store.js";
import { newTieredTouchpointSummary } from "./tiered-touchpoint-summary.js";

test("MemoryTieredTouchpointSummaryStore finds what it saved", () => {
  const store = newMemoryTieredTouchpointSummaryStore();
  const item = newTieredTouchpointSummary("code-616", "name-568");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
