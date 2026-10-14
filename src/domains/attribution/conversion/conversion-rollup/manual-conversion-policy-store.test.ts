import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualConversionPolicyStore } from "./manual-conversion-policy-store.js";
import { newManualConversionPolicy } from "./manual-conversion-policy.js";

test("MemoryManualConversionPolicyStore finds what it saved", () => {
  const store = newMemoryManualConversionPolicyStore();
  const item = newManualConversionPolicy("code-206", "label-491");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
