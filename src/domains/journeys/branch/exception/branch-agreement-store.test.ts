import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchAgreementStore } from "./branch-agreement-store.js";
import { newBranchAgreement } from "./branch-agreement.js";

test("MemoryBranchAgreementStore finds what it saved", () => {
  const store = newMemoryBranchAgreementStore();
  const item = newBranchAgreement("code-612", "title-740");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
