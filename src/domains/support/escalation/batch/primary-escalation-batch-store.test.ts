import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryEscalationBatchStore } from "./primary-escalation-batch-store.js";
import { newPrimaryEscalationBatch } from "./primary-escalation-batch.js";

test("MemoryPrimaryEscalationBatchStore finds what it saved", () => {
  const store = newMemoryPrimaryEscalationBatchStore();
  const item = newPrimaryEscalationBatch("code-289", "title-235");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
