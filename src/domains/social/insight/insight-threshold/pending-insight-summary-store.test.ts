import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingInsightSummaryStore } from "./pending-insight-summary-store.js";
import { newPendingInsightSummary } from "./pending-insight-summary.js";

test("MemoryPendingInsightSummaryStore finds what it saved", () => {
  const store = newMemoryPendingInsightSummaryStore();
  const item = newPendingInsightSummary("code-156", "name-313");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
