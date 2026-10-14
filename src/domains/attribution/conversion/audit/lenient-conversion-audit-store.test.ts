import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientConversionAuditStore } from "./lenient-conversion-audit-store.js";
import { newLenientConversionAudit } from "./lenient-conversion-audit.js";

test("MemoryLenientConversionAuditStore finds what it saved", () => {
  const store = newMemoryLenientConversionAuditStore();
  const item = newLenientConversionAudit("code-254", "label-973");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
