import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortCheckpointStore } from "./cohort-checkpoint-store.js";
import { newCohortCheckpoint } from "./cohort-checkpoint.js";

test("MemoryCohortCheckpointStore finds what it saved", () => {
  const store = newMemoryCohortCheckpointStore();
  const item = newCohortCheckpoint("code-361", "name-432");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
