import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneySummaryStore } from "./journey-summary-store.js";
import { newJourneySummary } from "./journey-summary.js";

test("MemoryJourneySummaryStore finds what it saved", () => {
  const store = newMemoryJourneySummaryStore();
  const item = newJourneySummary("code-892", "name-46");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
