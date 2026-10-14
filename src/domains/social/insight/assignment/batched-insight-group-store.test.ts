import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedInsightGroupStore } from "./batched-insight-group-store.js";
import { newBatchedInsightGroup } from "./batched-insight-group.js";

test("MemoryBatchedInsightGroupStore finds what it saved", () => {
  const store = newMemoryBatchedInsightGroupStore();
  const item = newBatchedInsightGroup("code-943", "label-484");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
