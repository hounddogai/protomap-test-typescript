import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalQueueBaselineStore } from "./seasonal-queue-baseline-store.js";
import { newSeasonalQueueBaseline } from "./seasonal-queue-baseline.js";

test("MemorySeasonalQueueBaselineStore finds what it saved", () => {
  const store = newMemorySeasonalQueueBaselineStore();
  const item = newSeasonalQueueBaseline("code-4", "label-573");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
