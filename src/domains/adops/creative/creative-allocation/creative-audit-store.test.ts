import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeAuditStore } from "./creative-audit-store.js";
import { newCreativeAudit } from "./creative-audit.js";

test("MemoryCreativeAuditStore finds what it saved", () => {
  const store = newMemoryCreativeAuditStore();
  const item = newCreativeAudit("code-723", "label-76");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
