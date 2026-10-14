import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveBranchSummaryStore } from "./adaptive-branch-summary-store.js";
import { newAdaptiveBranchSummary } from "./adaptive-branch-summary.js";

test("MemoryAdaptiveBranchSummaryStore finds what it saved", () => {
  const store = newMemoryAdaptiveBranchSummaryStore();
  const item = newAdaptiveBranchSummary("code-536", "label-540");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
