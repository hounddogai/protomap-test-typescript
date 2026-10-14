import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointSummaryStore } from "./touchpoint-summary-store.js";
import { newTouchpointSummary } from "./touchpoint-summary.js";

test("MemoryTouchpointSummaryStore finds what it saved", () => {
  const store = newMemoryTouchpointSummaryStore();
  const item = newTouchpointSummary("code-694", "label-137");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
