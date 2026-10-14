import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationTargetStore } from "./escalation-target-store.js";
import { newEscalationTarget } from "./escalation-target.js";

test("MemoryEscalationTargetStore finds what it saved", () => {
  const store = newMemoryEscalationTargetStore();
  const item = newEscalationTarget("code-295", "label-454");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
