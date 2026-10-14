import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyBatchStore } from "./journey-batch-store.js";
import { newJourneyBatch } from "./journey-batch.js";

test("MemoryJourneyBatchStore finds what it saved", () => {
  const store = newMemoryJourneyBatchStore();
  const item = newJourneyBatch("code-545", "title-72");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
