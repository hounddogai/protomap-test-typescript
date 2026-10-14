import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionCheckpointStore } from "./conversion-checkpoint-store.js";
import { newConversionCheckpoint } from "./conversion-checkpoint.js";

test("MemoryConversionCheckpointStore finds what it saved", () => {
  const store = newMemoryConversionCheckpointStore();
  const item = newConversionCheckpoint("code-821", "title-479");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
