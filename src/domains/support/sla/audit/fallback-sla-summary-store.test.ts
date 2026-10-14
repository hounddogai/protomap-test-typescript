import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackSlaSummaryStore } from "./fallback-sla-summary-store.js";
import { newFallbackSlaSummary } from "./fallback-sla-summary.js";

test("MemoryFallbackSlaSummaryStore finds what it saved", () => {
  const store = newMemoryFallbackSlaSummaryStore();
  const item = newFallbackSlaSummary("code-99", "title-138");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
