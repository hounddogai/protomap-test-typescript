import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictApprovalRollupStore } from "./strict-approval-rollup-store.js";
import { newStrictApprovalRollup } from "./strict-approval-rollup.js";

test("MemoryStrictApprovalRollupStore finds what it saved", () => {
  const store = newMemoryStrictApprovalRollupStore();
  const item = newStrictApprovalRollup("code-694", "title-563");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
