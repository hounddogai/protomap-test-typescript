import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationCheckpointStore } from "./escalation-checkpoint-store.js";
import { newEscalationCheckpoint } from "./escalation-checkpoint.js";

test("MemoryEscalationCheckpointStore finds what it saved", () => {
  const store = newMemoryEscalationCheckpointStore();
  const item = newEscalationCheckpoint("code-595", "label-679");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
