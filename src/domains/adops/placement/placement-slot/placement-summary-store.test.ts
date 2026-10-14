import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementSummaryStore } from "./placement-summary-store.js";
import { newPlacementSummary } from "./placement-summary.js";

test("MemoryPlacementSummaryStore finds what it saved", () => {
  const store = newMemoryPlacementSummaryStore();
  const item = newPlacementSummary("code-36", "label-911");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
