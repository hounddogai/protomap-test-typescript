import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualSlaPlanStore } from "./manual-sla-plan-store.js";
import { newManualSlaPlan } from "./manual-sla-plan.js";

test("MemoryManualSlaPlanStore finds what it saved", () => {
  const store = newMemoryManualSlaPlanStore();
  const item = newManualSlaPlan("code-770", "label-314");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
