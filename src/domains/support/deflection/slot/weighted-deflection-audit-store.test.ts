import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedDeflectionAuditStore } from "./weighted-deflection-audit-store.js";
import { newWeightedDeflectionAudit } from "./weighted-deflection-audit.js";

test("MemoryWeightedDeflectionAuditStore finds what it saved", () => {
  const store = newMemoryWeightedDeflectionAuditStore();
  const item = newWeightedDeflectionAudit("code-442", "title-868");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
