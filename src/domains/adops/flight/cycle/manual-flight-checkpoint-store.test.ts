import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualFlightCheckpointStore } from "./manual-flight-checkpoint-store.js";
import { newManualFlightCheckpoint } from "./manual-flight-checkpoint.js";

test("MemoryManualFlightCheckpointStore finds what it saved", () => {
  const store = newMemoryManualFlightCheckpointStore();
  const item = newManualFlightCheckpoint("code-857", "title-567");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
