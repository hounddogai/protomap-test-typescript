import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalEscalationVarianceStore } from "./regional-escalation-variance-store.js";
import { newRegionalEscalationVariance } from "./regional-escalation-variance.js";

test("MemoryRegionalEscalationVarianceStore finds what it saved", () => {
  const store = newMemoryRegionalEscalationVarianceStore();
  const item = newRegionalEscalationVariance("code-630", "name-998");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
