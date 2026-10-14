import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyTargetStore } from "./frequency-target-store.js";
import { newFrequencyTarget } from "./frequency-target.js";

test("MemoryFrequencyTargetStore finds what it saved", () => {
  const store = newMemoryFrequencyTargetStore();
  const item = newFrequencyTarget("code-970", "name-329");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
