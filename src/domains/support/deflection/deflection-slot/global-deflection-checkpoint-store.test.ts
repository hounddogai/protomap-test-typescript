import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalDeflectionCheckpointStore } from "./global-deflection-checkpoint-store.js";
import { newGlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

test("MemoryGlobalDeflectionCheckpointStore finds what it saved", () => {
  const store = newMemoryGlobalDeflectionCheckpointStore();
  const item = newGlobalDeflectionCheckpoint("code-201", "label-413");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
