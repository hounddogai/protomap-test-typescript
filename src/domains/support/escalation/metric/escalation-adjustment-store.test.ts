import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationAdjustmentStore } from "./escalation-adjustment-store.js";
import { newEscalationAdjustment } from "./escalation-adjustment.js";

test("MemoryEscalationAdjustmentStore finds what it saved", () => {
  const store = newMemoryEscalationAdjustmentStore();
  const item = newEscalationAdjustment("code-998", "name-478");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
