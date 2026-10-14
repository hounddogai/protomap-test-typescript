import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedConversionAuditStore } from "./weighted-conversion-audit-store.js";
import { newWeightedConversionAudit } from "./weighted-conversion-audit.js";

test("MemoryWeightedConversionAuditStore finds what it saved", () => {
  const store = newMemoryWeightedConversionAuditStore();
  const item = newWeightedConversionAudit("code-655", "name-136");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
