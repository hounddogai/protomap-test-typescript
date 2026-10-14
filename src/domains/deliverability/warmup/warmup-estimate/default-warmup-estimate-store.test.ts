import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultWarmupEstimateStore } from "./default-warmup-estimate-store.js";
import { newDefaultWarmupEstimate } from "./default-warmup-estimate.js";

test("MemoryDefaultWarmupEstimateStore finds what it saved", () => {
  const store = newMemoryDefaultWarmupEstimateStore();
  const item = newDefaultWarmupEstimate("code-97", "title-123");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
