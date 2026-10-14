import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditPolicyStore } from "./credit-policy-store.js";
import { newCreditPolicy } from "./credit-policy.js";

test("MemoryCreditPolicyStore finds what it saved", () => {
  const store = newMemoryCreditPolicyStore();
  const item = newCreditPolicy("code-357", "name-248");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
