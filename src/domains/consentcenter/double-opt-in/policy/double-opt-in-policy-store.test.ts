import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInPolicyStore } from "./double-opt-in-policy-store.js";
import { newDoubleOptInPolicy } from "./double-opt-in-policy.js";

test("MemoryDoubleOptInPolicyStore finds what it saved", () => {
  const store = newMemoryDoubleOptInPolicyStore();
  const item = newDoubleOptInPolicy("code-800", "label-954");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
