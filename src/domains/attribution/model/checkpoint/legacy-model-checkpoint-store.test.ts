import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyModelCheckpointStore } from "./legacy-model-checkpoint-store.js";
import { newLegacyModelCheckpoint } from "./legacy-model-checkpoint.js";

test("MemoryLegacyModelCheckpointStore finds what it saved", () => {
  const store = newMemoryLegacyModelCheckpointStore();
  const item = newLegacyModelCheckpoint("code-719", "label-219");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
