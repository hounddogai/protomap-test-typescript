import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroCheckpointStore } from "./macro-checkpoint-store.js";
import { newMacroCheckpoint } from "./macro-checkpoint.js";

test("MemoryMacroCheckpointStore finds what it saved", () => {
  const store = newMemoryMacroCheckpointStore();
  const item = newMacroCheckpoint("code-117", "label-268");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
