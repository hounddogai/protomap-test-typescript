import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientLevelThresholdStore } from "./lenient-level-threshold-store.js";
import { newLenientLevelThreshold } from "./lenient-level-threshold.js";

test("MemoryLenientLevelThresholdStore finds what it saved", () => {
  const store = newMemoryLenientLevelThresholdStore();
  const item = newLenientLevelThreshold("code-370", "title-320");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
