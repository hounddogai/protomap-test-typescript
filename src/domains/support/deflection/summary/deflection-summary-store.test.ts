import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionSummaryStore } from "./deflection-summary-store.js";
import { newDeflectionSummary } from "./deflection-summary.js";

test("MemoryDeflectionSummaryStore finds what it saved", () => {
  const store = newMemoryDeflectionSummaryStore();
  const item = newDeflectionSummary("code-618", "label-446");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
