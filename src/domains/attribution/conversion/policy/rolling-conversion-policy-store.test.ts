import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingConversionPolicyStore } from "./rolling-conversion-policy-store.js";
import { newRollingConversionPolicy } from "./rolling-conversion-policy.js";

test("MemoryRollingConversionPolicyStore finds what it saved", () => {
  const store = newMemoryRollingConversionPolicyStore();
  const item = newRollingConversionPolicy("code-928", "title-326");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
