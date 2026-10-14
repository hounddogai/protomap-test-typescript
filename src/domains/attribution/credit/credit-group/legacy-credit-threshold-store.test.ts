import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyCreditThresholdStore } from "./legacy-credit-threshold-store.js";
import { newLegacyCreditThreshold } from "./legacy-credit-threshold.js";

test("MemoryLegacyCreditThresholdStore finds what it saved", () => {
  const store = newMemoryLegacyCreditThresholdStore();
  const item = newLegacyCreditThreshold("code-103", "title-58");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
