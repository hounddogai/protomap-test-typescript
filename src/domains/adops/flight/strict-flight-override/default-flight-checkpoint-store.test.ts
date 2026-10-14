import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFlightCheckpointStore } from "./default-flight-checkpoint-store.js";
import { newDefaultFlightCheckpoint } from "./default-flight-checkpoint.js";

test("MemoryDefaultFlightCheckpointStore finds what it saved", () => {
  const store = newMemoryDefaultFlightCheckpointStore();
  const item = newDefaultFlightCheckpoint("code-250", "title-61");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
