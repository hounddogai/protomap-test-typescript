import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelCheckpointStore } from "./funnel-checkpoint-store.js";
import { newFunnelCheckpoint } from "./funnel-checkpoint.js";

test("MemoryFunnelCheckpointStore finds what it saved", () => {
  const store = newMemoryFunnelCheckpointStore();
  const item = newFunnelCheckpoint("code-367", "label-64");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
