import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDeflectionCheckpointStore } from "./scheduled-deflection-checkpoint-store.js";
import { newScheduledDeflectionCheckpoint } from "./scheduled-deflection-checkpoint.js";

test("MemoryScheduledDeflectionCheckpointStore finds what it saved", () => {
  const store = newMemoryScheduledDeflectionCheckpointStore();
  const item = newScheduledDeflectionCheckpoint("code-240", "title-573");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
