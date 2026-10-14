import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryConversionAuditStore } from "./primary-conversion-audit-store.js";
import { newPrimaryConversionAudit } from "./primary-conversion-audit.js";

test("MemoryPrimaryConversionAuditStore finds what it saved", () => {
  const store = newMemoryPrimaryConversionAuditStore();
  const item = newPrimaryConversionAudit("code-319", "title-388");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
