import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingThresholdStore } from "./pacing-threshold-store.js";
import { newPacingThreshold } from "./pacing-threshold.js";

test("MemoryPacingThresholdStore finds what it saved", () => {
  const store = newMemoryPacingThresholdStore();
  const item = newPacingThreshold("code-427", "name-537");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
