import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalModelCheckpointStore } from "./regional-model-checkpoint-store.js";
import { newRegionalModelCheckpoint } from "./regional-model-checkpoint.js";

test("MemoryRegionalModelCheckpointStore finds what it saved", () => {
  const store = newMemoryRegionalModelCheckpointStore();
  const item = newRegionalModelCheckpoint("code-950", "title-416");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
