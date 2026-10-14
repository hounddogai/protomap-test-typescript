import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientConversionPolicyStore } from "./lenient-conversion-policy-store.js";
import { newLenientConversionPolicy } from "./lenient-conversion-policy.js";

test("MemoryLenientConversionPolicyStore finds what it saved", () => {
  const store = newMemoryLenientConversionPolicyStore();
  const item = newLenientConversionPolicy("code-21", "name-465");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
