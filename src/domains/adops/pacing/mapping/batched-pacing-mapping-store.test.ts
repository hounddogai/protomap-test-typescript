import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPacingMappingStore } from "./batched-pacing-mapping-store.js";
import { newBatchedPacingMapping } from "./batched-pacing-mapping.js";

test("MemoryBatchedPacingMappingStore finds what it saved", () => {
  const store = newMemoryBatchedPacingMappingStore();
  const item = newBatchedPacingMapping("code-109", "title-837");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
