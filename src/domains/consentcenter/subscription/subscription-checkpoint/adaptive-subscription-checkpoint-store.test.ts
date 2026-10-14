import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveSubscriptionCheckpointStore } from "./adaptive-subscription-checkpoint-store.js";
import { newAdaptiveSubscriptionCheckpoint } from "./adaptive-subscription-checkpoint.js";

test("MemoryAdaptiveSubscriptionCheckpointStore finds what it saved", () => {
  const store = newMemoryAdaptiveSubscriptionCheckpointStore();
  const item = newAdaptiveSubscriptionCheckpoint("code-370", "title-600");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
