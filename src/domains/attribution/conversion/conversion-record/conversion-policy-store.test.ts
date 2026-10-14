import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionPolicyStore } from "./conversion-policy-store.js";
import { newConversionPolicy } from "./conversion-policy.js";

test("MemoryConversionPolicyStore finds what it saved", () => {
  const store = newMemoryConversionPolicyStore();
  const item = newConversionPolicy("code-368", "name-184");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
