import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictReputationSummaryStore } from "./strict-reputation-summary-store.js";
import { newStrictReputationSummary } from "./strict-reputation-summary.js";

test("MemoryStrictReputationSummaryStore finds what it saved", () => {
  const store = newMemoryStrictReputationSummaryStore();
  const item = newStrictReputationSummary("code-150", "title-58");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
