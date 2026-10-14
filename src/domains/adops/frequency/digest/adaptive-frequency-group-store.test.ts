import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveFrequencyGroupStore } from "./adaptive-frequency-group-store.js";
import { newAdaptiveFrequencyGroup } from "./adaptive-frequency-group.js";

test("MemoryAdaptiveFrequencyGroupStore finds what it saved", () => {
  const store = newMemoryAdaptiveFrequencyGroupStore();
  const item = newAdaptiveFrequencyGroup("code-534", "label-16");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
