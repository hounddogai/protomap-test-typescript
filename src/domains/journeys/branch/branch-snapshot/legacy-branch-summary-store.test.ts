import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyBranchSummaryStore } from "./legacy-branch-summary-store.js";
import { newLegacyBranchSummary } from "./legacy-branch-summary.js";

test("MemoryLegacyBranchSummaryStore finds what it saved", () => {
  const store = newMemoryLegacyBranchSummaryStore();
  const item = newLegacyBranchSummary("code-879", "label-806");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
