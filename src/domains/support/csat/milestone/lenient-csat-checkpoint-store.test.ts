import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientCsatCheckpointStore } from "./lenient-csat-checkpoint-store.js";
import { newLenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

test("MemoryLenientCsatCheckpointStore finds what it saved", () => {
  const store = newMemoryLenientCsatCheckpointStore();
  const item = newLenientCsatCheckpoint("code-411", "label-792");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
