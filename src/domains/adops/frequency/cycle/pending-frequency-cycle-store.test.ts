import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingFrequencyCycleStore } from "./pending-frequency-cycle-store.js";
import { newPendingFrequencyCycle } from "./pending-frequency-cycle.js";

test("MemoryPendingFrequencyCycleStore finds what it saved", () => {
  const store = newMemoryPendingFrequencyCycleStore();
  const item = newPendingFrequencyCycle("code-844", "title-927");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
