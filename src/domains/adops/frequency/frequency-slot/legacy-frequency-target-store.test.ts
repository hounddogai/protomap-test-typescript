import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyFrequencyTargetStore } from "./legacy-frequency-target-store.js";
import { newLegacyFrequencyTarget } from "./legacy-frequency-target.js";

test("MemoryLegacyFrequencyTargetStore finds what it saved", () => {
  const store = newMemoryLegacyFrequencyTargetStore();
  const item = newLegacyFrequencyTarget("code-12", "name-813");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
