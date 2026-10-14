import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingJourneySummaryStore } from "./rolling-journey-summary-store.js";
import { newRollingJourneySummary } from "./rolling-journey-summary.js";

test("MemoryRollingJourneySummaryStore finds what it saved", () => {
  const store = newMemoryRollingJourneySummaryStore();
  const item = newRollingJourneySummary("code-660", "name-622");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
