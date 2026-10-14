import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackEscalationSummaryStore } from "./fallback-escalation-summary-store.js";
import { newFallbackEscalationSummary } from "./fallback-escalation-summary.js";

test("MemoryFallbackEscalationSummaryStore finds what it saved", () => {
  const store = newMemoryFallbackEscalationSummaryStore();
  const item = newFallbackEscalationSummary("code-299", "name-321");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
