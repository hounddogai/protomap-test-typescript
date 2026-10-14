import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualCreativeAuditStore } from "./manual-creative-audit-store.js";
import { newManualCreativeAudit } from "./manual-creative-audit.js";

test("MemoryManualCreativeAuditStore finds what it saved", () => {
  const store = newMemoryManualCreativeAuditStore();
  const item = newManualCreativeAudit("code-926", "title-754");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
