import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveQueueTargetStore } from "./adaptive-queue-target-store.js";
import { newAdaptiveQueueTarget } from "./adaptive-queue-target.js";

test("MemoryAdaptiveQueueTargetStore finds what it saved", () => {
  const store = newMemoryAdaptiveQueueTargetStore();
  const item = newAdaptiveQueueTarget("code-515", "title-296");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
