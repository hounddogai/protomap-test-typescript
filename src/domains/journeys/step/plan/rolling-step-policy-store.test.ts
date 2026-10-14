import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingStepPolicyStore } from "./rolling-step-policy-store.js";
import { newRollingStepPolicy } from "./rolling-step-policy.js";

test("MemoryRollingStepPolicyStore finds what it saved", () => {
  const store = newMemoryRollingStepPolicyStore();
  const item = newRollingStepPolicy("code-207", "label-316");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
