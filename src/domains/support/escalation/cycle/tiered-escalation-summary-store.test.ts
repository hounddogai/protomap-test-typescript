import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredEscalationSummaryStore } from "./tiered-escalation-summary-store.js";
import { newTieredEscalationSummary } from "./tiered-escalation-summary.js";

test("MemoryTieredEscalationSummaryStore finds what it saved", () => {
  const store = newMemoryTieredEscalationSummaryStore();
  const item = newTieredEscalationSummary("code-990", "label-221");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
