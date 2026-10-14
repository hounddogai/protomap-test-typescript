import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictQueueTargetStore } from "./strict-queue-target-store.js";
import { newStrictQueueTarget } from "./strict-queue-target.js";

test("MemoryStrictQueueTargetStore finds what it saved", () => {
  const store = newMemoryStrictQueueTargetStore();
  const item = newStrictQueueTarget("code-122", "title-797");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
