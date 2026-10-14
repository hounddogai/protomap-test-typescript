import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackDomainPolicyStore } from "./fallback-domain-policy-store.js";
import { newFallbackDomainPolicy } from "./fallback-domain-policy.js";

test("MemoryFallbackDomainPolicyStore finds what it saved", () => {
  const store = newMemoryFallbackDomainPolicyStore();
  const item = newFallbackDomainPolicy("code-996", "name-669");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
