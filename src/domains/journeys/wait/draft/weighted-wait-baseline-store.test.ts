import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedWaitBaselineStore } from "./weighted-wait-baseline-store.js";
import { newWeightedWaitBaseline } from "./weighted-wait-baseline.js";

test("MemoryWeightedWaitBaselineStore finds what it saved", () => {
  const store = newMemoryWeightedWaitBaselineStore();
  const item = newWeightedWaitBaseline("code-414", "title-906");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
