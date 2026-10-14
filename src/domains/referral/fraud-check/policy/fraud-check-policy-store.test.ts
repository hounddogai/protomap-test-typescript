import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckPolicyStore } from "./fraud-check-policy-store.js";
import { newFraudCheckPolicy } from "./fraud-check-policy.js";

test("MemoryFraudCheckPolicyStore finds what it saved", () => {
  const store = newMemoryFraudCheckPolicyStore();
  const item = newFraudCheckPolicy("code-866", "title-268");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
