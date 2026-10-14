import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofVarianceStore } from "./proof-variance-store.js";
import { newProofVariance } from "./proof-variance.js";

test("MemoryProofVarianceStore finds what it saved", () => {
  const store = newMemoryProofVarianceStore();
  const item = newProofVariance("code-658", "name-797");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
