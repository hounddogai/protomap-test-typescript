import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackNudgeSummaryStore } from "./fallback-nudge-summary-store.js";
import { newFallbackNudgeSummary } from "./fallback-nudge-summary.js";

test("MemoryFallbackNudgeSummaryStore finds what it saved", () => {
  const store = newMemoryFallbackNudgeSummaryStore();
  const item = newFallbackNudgeSummary("code-642", "label-624");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
