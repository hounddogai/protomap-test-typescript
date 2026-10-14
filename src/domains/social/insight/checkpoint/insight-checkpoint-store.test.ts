import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightCheckpointStore } from "./insight-checkpoint-store.js";
import { newInsightCheckpoint } from "./insight-checkpoint.js";

test("MemoryInsightCheckpointStore finds what it saved", () => {
  const store = newMemoryInsightCheckpointStore();
  const item = newInsightCheckpoint("code-825", "name-366");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
