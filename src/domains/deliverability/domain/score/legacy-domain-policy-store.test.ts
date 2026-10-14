import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDomainPolicyStore } from "./legacy-domain-policy-store.js";
import { newLegacyDomainPolicy } from "./legacy-domain-policy.js";

test("MemoryLegacyDomainPolicyStore finds what it saved", () => {
  const store = newMemoryLegacyDomainPolicyStore();
  const item = newLegacyDomainPolicy("code-578", "label-645");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
