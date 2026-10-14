import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedReputationExceptionStore } from "./weighted-reputation-exception-store.js";
import { newWeightedReputationException } from "./weighted-reputation-exception.js";

test("MemoryWeightedReputationExceptionStore finds what it saved", () => {
  const store = newMemoryWeightedReputationExceptionStore();
  const item = newWeightedReputationException("code-365", "label-776");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
