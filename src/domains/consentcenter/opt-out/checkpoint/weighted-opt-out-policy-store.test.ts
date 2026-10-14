import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedOptOutPolicyStore } from "./weighted-opt-out-policy-store.js";
import { newWeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

test("MemoryWeightedOptOutPolicyStore finds what it saved", () => {
  const store = newMemoryWeightedOptOutPolicyStore();
  const item = newWeightedOptOutPolicy("code-162", "label-320");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
