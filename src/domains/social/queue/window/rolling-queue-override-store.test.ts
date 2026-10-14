import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingQueueOverrideStore } from "./rolling-queue-override-store.js";
import { newRollingQueueOverride } from "./rolling-queue-override.js";

test("MemoryRollingQueueOverrideStore finds what it saved", () => {
  const store = newMemoryRollingQueueOverrideStore();
  const item = newRollingQueueOverride("code-986", "name-777");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
