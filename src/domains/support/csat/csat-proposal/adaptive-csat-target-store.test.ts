import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveCsatTargetStore } from "./adaptive-csat-target-store.js";
import { newAdaptiveCsatTarget } from "./adaptive-csat-target.js";

test("MemoryAdaptiveCsatTargetStore finds what it saved", () => {
  const store = newMemoryAdaptiveCsatTargetStore();
  const item = newAdaptiveCsatTarget("code-863", "name-554");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
