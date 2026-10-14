import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainThresholdStore } from "./domain-threshold-store.js";
import { newDomainThreshold } from "./domain-threshold.js";

test("MemoryDomainThresholdStore finds what it saved", () => {
  const store = newMemoryDomainThresholdStore();
  const item = newDomainThreshold("code-288", "label-361");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
