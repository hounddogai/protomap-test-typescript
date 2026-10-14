import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyEscalationBatchStore } from "./legacy-escalation-batch-store.js";
import { newLegacyEscalationBatch } from "./legacy-escalation-batch.js";

test("MemoryLegacyEscalationBatchStore finds what it saved", () => {
  const store = newMemoryLegacyEscalationBatchStore();
  const item = newLegacyEscalationBatch("code-628", "name-97");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
