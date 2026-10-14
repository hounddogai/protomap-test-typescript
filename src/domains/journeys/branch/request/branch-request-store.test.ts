import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchRequestStore } from "./branch-request-store.js";
import { newBranchRequest } from "./branch-request.js";

test("MemoryBranchRequestStore finds what it saved", () => {
  const store = newMemoryBranchRequestStore();
  const item = newBranchRequest("code-806", "title-506");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
