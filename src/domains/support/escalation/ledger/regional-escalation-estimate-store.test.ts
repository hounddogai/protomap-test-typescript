import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalEscalationEstimateStore } from "./regional-escalation-estimate-store.js";
import { newRegionalEscalationEstimate } from "./regional-escalation-estimate.js";

test("MemoryRegionalEscalationEstimateStore finds what it saved", () => {
  const store = newMemoryRegionalEscalationEstimateStore();
  const item = newRegionalEscalationEstimate("code-401", "name-515");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
