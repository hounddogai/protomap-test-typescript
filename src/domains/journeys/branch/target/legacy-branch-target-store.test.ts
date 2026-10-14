import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyBranchTargetStore } from "./legacy-branch-target-store.js";
import { newLegacyBranchTarget } from "./legacy-branch-target.js";

test("MemoryLegacyBranchTargetStore finds what it saved", () => {
  const store = newMemoryLegacyBranchTargetStore();
  const item = newLegacyBranchTarget("code-669", "title-277");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
