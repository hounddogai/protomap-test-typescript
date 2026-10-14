import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingFlightCheckpointStore } from "./pending-flight-checkpoint-store.js";
import { newPendingFlightCheckpoint } from "./pending-flight-checkpoint.js";

test("MemoryPendingFlightCheckpointStore finds what it saved", () => {
  const store = newMemoryPendingFlightCheckpointStore();
  const item = newPendingFlightCheckpoint("code-209", "title-464");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
