import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedConversionPolicyStore } from "./capped-conversion-policy-store.js";
import { newCappedConversionPolicy } from "./capped-conversion-policy.js";

test("MemoryCappedConversionPolicyStore finds what it saved", () => {
  const store = newMemoryCappedConversionPolicyStore();
  const item = newCappedConversionPolicy("code-707", "name-897");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
