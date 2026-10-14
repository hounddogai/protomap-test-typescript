import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueEstimateStore } from "./queue-estimate-store.js";
import { newQueueEstimate } from "./queue-estimate.js";

test("MemoryQueueEstimateStore finds what it saved", () => {
  const store = newMemoryQueueEstimateStore();
  const item = newQueueEstimate("code-832", "title-592");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
