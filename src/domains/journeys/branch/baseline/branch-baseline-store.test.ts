import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchBaselineStore } from "./branch-baseline-store.js";
import { newBranchBaseline } from "./branch-baseline.js";

test("MemoryBranchBaselineStore finds what it saved", () => {
  const store = newMemoryBranchBaselineStore();
  const item = newBranchBaseline("code-644", "title-543");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
