import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedDomainThresholdStore } from "./capped-domain-threshold-store.js";
import { newCappedDomainThreshold } from "./capped-domain-threshold.js";

test("MemoryCappedDomainThresholdStore finds what it saved", () => {
  const store = newMemoryCappedDomainThresholdStore();
  const item = newCappedDomainThreshold("code-358", "label-533");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
