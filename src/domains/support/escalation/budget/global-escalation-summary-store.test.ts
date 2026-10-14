import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalEscalationSummaryStore } from "./global-escalation-summary-store.js";
import { newGlobalEscalationSummary } from "./global-escalation-summary.js";

test("MemoryGlobalEscalationSummaryStore finds what it saved", () => {
  const store = newMemoryGlobalEscalationSummaryStore();
  const item = newGlobalEscalationSummary("code-162", "name-957");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
