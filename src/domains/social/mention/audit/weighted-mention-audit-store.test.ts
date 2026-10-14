import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedMentionAuditStore } from "./weighted-mention-audit-store.js";
import { newWeightedMentionAudit } from "./weighted-mention-audit.js";

test("MemoryWeightedMentionAuditStore finds what it saved", () => {
  const store = newMemoryWeightedMentionAuditStore();
  const item = newWeightedMentionAudit("code-232", "label-839");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
