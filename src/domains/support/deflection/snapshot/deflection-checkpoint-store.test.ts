import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionCheckpointStore } from "./deflection-checkpoint-store.js";
import { newDeflectionCheckpoint } from "./deflection-checkpoint.js";

test("MemoryDeflectionCheckpointStore finds what it saved", () => {
  const store = newMemoryDeflectionCheckpointStore();
  const item = newDeflectionCheckpoint("code-189", "name-343");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
