import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalWarmupCheckpointStore } from "./seasonal-warmup-checkpoint-store.js";
import { newSeasonalWarmupCheckpoint } from "./seasonal-warmup-checkpoint.js";

test("MemorySeasonalWarmupCheckpointStore finds what it saved", () => {
  const store = newMemorySeasonalWarmupCheckpointStore();
  const item = newSeasonalWarmupCheckpoint("code-508", "title-26");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
