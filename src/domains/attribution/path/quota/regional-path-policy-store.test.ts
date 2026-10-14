import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPathPolicyStore } from "./regional-path-policy-store.js";
import { newRegionalPathPolicy } from "./regional-path-policy.js";

test("MemoryRegionalPathPolicyStore finds what it saved", () => {
  const store = newMemoryRegionalPathPolicyStore();
  const item = newRegionalPathPolicy("code-700", "label-423");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
