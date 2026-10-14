import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaSummaryStore } from "./sla-summary-store.js";
import { newSlaSummary } from "./sla-summary.js";

test("MemorySlaSummaryStore finds what it saved", () => {
  const store = newMemorySlaSummaryStore();
  const item = newSlaSummary("code-863", "label-200");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
