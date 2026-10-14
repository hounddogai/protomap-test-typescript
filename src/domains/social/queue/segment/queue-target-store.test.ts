import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueTargetStore } from "./queue-target-store.js";
import { newQueueTarget } from "./queue-target.js";

test("MemoryQueueTargetStore finds what it saved", () => {
  const store = newMemoryQueueTargetStore();
  const item = newQueueTarget("code-176", "name-107");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
