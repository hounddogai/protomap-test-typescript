import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatThresholdStore } from "./csat-threshold-store.js";
import { newCsatThreshold } from "./csat-threshold.js";

test("MemoryCsatThresholdStore finds what it saved", () => {
  const store = newMemoryCsatThresholdStore();
  const item = newCsatThreshold("code-423", "name-284");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
