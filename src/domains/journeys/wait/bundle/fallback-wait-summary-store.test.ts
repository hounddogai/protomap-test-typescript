import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackWaitSummaryStore } from "./fallback-wait-summary-store.js";
import { newFallbackWaitSummary } from "./fallback-wait-summary.js";

test("MemoryFallbackWaitSummaryStore finds what it saved", () => {
  const store = newMemoryFallbackWaitSummaryStore();
  const item = newFallbackWaitSummary("code-369", "title-286");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
