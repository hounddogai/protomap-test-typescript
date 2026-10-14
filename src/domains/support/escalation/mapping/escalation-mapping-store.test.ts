import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationMappingStore } from "./escalation-mapping-store.js";
import { newEscalationMapping } from "./escalation-mapping.js";

test("MemoryEscalationMappingStore finds what it saved", () => {
  const store = newMemoryEscalationMappingStore();
  const item = newEscalationMapping("code-581", "title-143");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
