import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredDomainThresholdStore } from "./tiered-domain-threshold-store.js";
import { newTieredDomainThreshold } from "./tiered-domain-threshold.js";

test("MemoryTieredDomainThresholdStore finds what it saved", () => {
  const store = newMemoryTieredDomainThresholdStore();
  const item = newTieredDomainThreshold("code-697", "name-471");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
