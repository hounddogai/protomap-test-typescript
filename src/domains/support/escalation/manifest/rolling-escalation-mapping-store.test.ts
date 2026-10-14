import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingEscalationMappingStore } from "./rolling-escalation-mapping-store.js";
import { newRollingEscalationMapping } from "./rolling-escalation-mapping.js";

test("MemoryRollingEscalationMappingStore finds what it saved", () => {
  const store = newMemoryRollingEscalationMappingStore();
  const item = newRollingEscalationMapping("code-184", "label-643");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
