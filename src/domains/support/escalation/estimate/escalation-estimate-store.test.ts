import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationEstimateStore } from "./escalation-estimate-store.js";
import { newEscalationEstimate } from "./escalation-estimate.js";

test("MemoryEscalationEstimateStore finds what it saved", () => {
  const store = newMemoryEscalationEstimateStore();
  const item = newEscalationEstimate("code-3", "name-540");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
