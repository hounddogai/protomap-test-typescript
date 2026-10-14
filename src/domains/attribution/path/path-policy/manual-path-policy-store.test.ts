import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPathPolicyStore } from "./manual-path-policy-store.js";
import { newManualPathPolicy } from "./manual-path-policy.js";

test("MemoryManualPathPolicyStore finds what it saved", () => {
  const store = newMemoryManualPathPolicyStore();
  const item = newManualPathPolicy("code-931", "label-633");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
