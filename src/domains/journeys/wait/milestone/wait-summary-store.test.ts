import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitSummaryStore } from "./wait-summary-store.js";
import { newWaitSummary } from "./wait-summary.js";

test("MemoryWaitSummaryStore finds what it saved", () => {
  const store = newMemoryWaitSummaryStore();
  const item = newWaitSummary("code-221", "label-655");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
