import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatAuditStore } from "./csat-audit-store.js";
import { newCsatAudit } from "./csat-audit.js";

test("MemoryCsatAuditStore finds what it saved", () => {
  const store = newMemoryCsatAuditStore();
  const item = newCsatAudit("code-766", "title-20");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
