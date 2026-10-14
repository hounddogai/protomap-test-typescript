import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightAuditStore } from "./insight-audit-store.js";
import { newInsightAudit } from "./insight-audit.js";

test("MemoryInsightAuditStore finds what it saved", () => {
  const store = newMemoryInsightAuditStore();
  const item = newInsightAudit("code-823", "name-873");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
