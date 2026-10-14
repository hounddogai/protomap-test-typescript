import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingCsatPolicyStore } from "./pending-csat-policy-store.js";
import { newPendingCsatPolicy } from "./pending-csat-policy.js";

test("MemoryPendingCsatPolicyStore finds what it saved", () => {
  const store = newMemoryPendingCsatPolicyStore();
  const item = newPendingCsatPolicy("code-316", "name-459");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
