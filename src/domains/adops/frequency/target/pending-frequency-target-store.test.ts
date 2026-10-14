import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingFrequencyTargetStore } from "./pending-frequency-target-store.js";
import { newPendingFrequencyTarget } from "./pending-frequency-target.js";

test("MemoryPendingFrequencyTargetStore finds what it saved", () => {
  const store = newMemoryPendingFrequencyTargetStore();
  const item = newPendingFrequencyTarget("code-210", "title-50");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
