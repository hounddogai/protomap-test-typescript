import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedTouchpointSummaryStore } from "./capped-touchpoint-summary-store.js";
import { newCappedTouchpointSummary } from "./capped-touchpoint-summary.js";

test("MemoryCappedTouchpointSummaryStore finds what it saved", () => {
  const store = newMemoryCappedTouchpointSummaryStore();
  const item = newCappedTouchpointSummary("code-682", "title-886");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
