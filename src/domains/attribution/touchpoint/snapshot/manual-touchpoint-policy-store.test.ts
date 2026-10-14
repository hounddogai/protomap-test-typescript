import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualTouchpointPolicyStore } from "./manual-touchpoint-policy-store.js";
import { newManualTouchpointPolicy } from "./manual-touchpoint-policy.js";

test("MemoryManualTouchpointPolicyStore finds what it saved", () => {
  const store = newMemoryManualTouchpointPolicyStore();
  const item = newManualTouchpointPolicy("code-536", "name-347");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
