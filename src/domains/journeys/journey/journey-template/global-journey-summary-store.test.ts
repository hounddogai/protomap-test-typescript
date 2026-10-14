import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalJourneySummaryStore } from "./global-journey-summary-store.js";
import { newGlobalJourneySummary } from "./global-journey-summary.js";

test("MemoryGlobalJourneySummaryStore finds what it saved", () => {
  const store = newMemoryGlobalJourneySummaryStore();
  const item = newGlobalJourneySummary("code-675", "title-857");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
