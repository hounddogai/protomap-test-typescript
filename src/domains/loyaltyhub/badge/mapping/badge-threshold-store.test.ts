import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeThresholdStore } from "./badge-threshold-store.js";
import { newBadgeThreshold } from "./badge-threshold.js";

test("MemoryBadgeThresholdStore finds what it saved", () => {
  const store = newMemoryBadgeThresholdStore();
  const item = newBadgeThreshold("code-205", "label-349");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
