import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingDomainVarianceStore } from "./rolling-domain-variance-store.js";
import { newRollingDomainVariance } from "./rolling-domain-variance.js";

test("MemoryRollingDomainVarianceStore finds what it saved", () => {
  const store = newMemoryRollingDomainVarianceStore();
  const item = newRollingDomainVariance("code-717", "name-737");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
