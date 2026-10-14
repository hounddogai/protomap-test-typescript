import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryFlightCheckpointStore } from "./primary-flight-checkpoint-store.js";
import { newPrimaryFlightCheckpoint } from "./primary-flight-checkpoint.js";

test("MemoryPrimaryFlightCheckpointStore finds what it saved", () => {
  const store = newMemoryPrimaryFlightCheckpointStore();
  const item = newPrimaryFlightCheckpoint("code-546", "name-673");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
