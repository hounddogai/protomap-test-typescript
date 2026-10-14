import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingJourneySummaryStore } from "./pending-journey-summary-store.js";
import { newPendingJourneySummary } from "./pending-journey-summary.js";

test("MemoryPendingJourneySummaryStore finds what it saved", () => {
  const store = newMemoryPendingJourneySummaryStore();
  const item = newPendingJourneySummary("code-692", "name-790");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
