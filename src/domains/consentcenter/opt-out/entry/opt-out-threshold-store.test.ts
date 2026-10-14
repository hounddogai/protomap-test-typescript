import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutThresholdStore } from "./opt-out-threshold-store.js";
import { newOptOutThreshold } from "./opt-out-threshold.js";

test("MemoryOptOutThresholdStore finds what it saved", () => {
  const store = newMemoryOptOutThresholdStore();
  const item = newOptOutThreshold("code-65", "name-730");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
