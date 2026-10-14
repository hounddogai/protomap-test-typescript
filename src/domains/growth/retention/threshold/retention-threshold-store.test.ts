import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionThresholdStore } from "./retention-threshold-store.js";
import { newRetentionThreshold } from "./retention-threshold.js";

test("MemoryRetentionThresholdStore finds what it saved", () => {
  const store = newMemoryRetentionThresholdStore();
  const item = newRetentionThreshold("code-664", "name-683");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
