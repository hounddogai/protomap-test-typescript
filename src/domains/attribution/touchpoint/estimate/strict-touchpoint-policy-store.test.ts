import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictTouchpointPolicyStore } from "./strict-touchpoint-policy-store.js";
import { newStrictTouchpointPolicy } from "./strict-touchpoint-policy.js";

test("MemoryStrictTouchpointPolicyStore finds what it saved", () => {
  const store = newMemoryStrictTouchpointPolicyStore();
  const item = newStrictTouchpointPolicy("code-681", "label-917");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
