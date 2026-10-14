import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationCycleStore } from "./escalation-cycle-store.js";
import { newEscalationCycle } from "./escalation-cycle.js";

test("MemoryEscalationCycleStore finds what it saved", () => {
  const store = newMemoryEscalationCycleStore();
  const item = newEscalationCycle("code-522", "label-472");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
