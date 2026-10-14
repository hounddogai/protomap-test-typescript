import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedProofTargetStore } from "./weighted-proof-target-store.js";
import { newWeightedProofTarget } from "./weighted-proof-target.js";

test("MemoryWeightedProofTargetStore finds what it saved", () => {
  const store = newMemoryWeightedProofTargetStore();
  const item = newWeightedProofTarget("code-763", "title-728");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
