import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedProofRollupStore } from "./weighted-proof-rollup-store.js";
import { newWeightedProofRollup } from "./weighted-proof-rollup.js";

test("MemoryWeightedProofRollupStore finds what it saved", () => {
  const store = newMemoryWeightedProofRollupStore();
  const item = newWeightedProofRollup("code-366", "name-348");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
