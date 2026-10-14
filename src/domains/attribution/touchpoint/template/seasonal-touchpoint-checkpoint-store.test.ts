import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalTouchpointCheckpointStore } from "./seasonal-touchpoint-checkpoint-store.js";
import { newSeasonalTouchpointCheckpoint } from "./seasonal-touchpoint-checkpoint.js";

test("MemorySeasonalTouchpointCheckpointStore finds what it saved", () => {
  const store = newMemorySeasonalTouchpointCheckpointStore();
  const item = newSeasonalTouchpointCheckpoint("code-680", "label-720");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
