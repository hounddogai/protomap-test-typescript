import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveRetentionGroupStore } from "./adaptive-retention-group-store.js";
import { newAdaptiveRetentionGroup } from "./adaptive-retention-group.js";

test("MemoryAdaptiveRetentionGroupStore finds what it saved", () => {
  const store = newMemoryAdaptiveRetentionGroupStore();
  const item = newAdaptiveRetentionGroup("code-714", "title-154");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
