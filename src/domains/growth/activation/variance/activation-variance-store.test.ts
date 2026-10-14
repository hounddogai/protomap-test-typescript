import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationVarianceStore } from "./activation-variance-store.js";
import { newActivationVariance } from "./activation-variance.js";

test("MemoryActivationVarianceStore finds what it saved", () => {
  const store = newMemoryActivationVarianceStore();
  const item = newActivationVariance("code-834", "name-355");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
