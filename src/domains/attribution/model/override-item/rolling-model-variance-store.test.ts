import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingModelVarianceStore } from "./rolling-model-variance-store.js";
import { newRollingModelVariance } from "./rolling-model-variance.js";

test("MemoryRollingModelVarianceStore finds what it saved", () => {
  const store = newMemoryRollingModelVarianceStore();
  const item = newRollingModelVariance("code-845", "name-808");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
