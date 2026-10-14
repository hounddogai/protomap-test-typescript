import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictTierPolicyStore } from "./strict-tier-policy-store.js";
import { newStrictTierPolicy } from "./strict-tier-policy.js";

test("MemoryStrictTierPolicyStore finds what it saved", () => {
  const store = newMemoryStrictTierPolicyStore();
  const item = newStrictTierPolicy("code-628", "label-103");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
