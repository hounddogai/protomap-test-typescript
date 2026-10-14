import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupAuditStore } from "./warmup-audit-store.js";
import { newWarmupAudit } from "./warmup-audit.js";

test("MemoryWarmupAuditStore finds what it saved", () => {
  const store = newMemoryWarmupAuditStore();
  const item = newWarmupAudit("code-951", "label-848");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
