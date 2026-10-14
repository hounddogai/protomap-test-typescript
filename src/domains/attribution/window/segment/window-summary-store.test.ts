import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowSummaryStore } from "./window-summary-store.js";
import { newWindowSummary } from "./window-summary.js";

test("MemoryWindowSummaryStore finds what it saved", () => {
  const store = newMemoryWindowSummaryStore();
  const item = newWindowSummary("code-868", "label-107");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
