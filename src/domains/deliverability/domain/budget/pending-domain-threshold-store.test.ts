import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingDomainThresholdStore } from "./pending-domain-threshold-store.js";
import { newPendingDomainThreshold } from "./pending-domain-threshold.js";

test("MemoryPendingDomainThresholdStore finds what it saved", () => {
  const store = newMemoryPendingDomainThresholdStore();
  const item = newPendingDomainThreshold("code-836", "name-539");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
