import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultInsightAuditStore } from "./default-insight-audit-store.js";
import { newDefaultInsightAudit } from "./default-insight-audit.js";

test("MemoryDefaultInsightAuditStore finds what it saved", () => {
  const store = newMemoryDefaultInsightAuditStore();
  const item = newDefaultInsightAudit("code-55", "title-700");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
