import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionVarianceStore } from "./deflection-variance-store.js";
import { newDeflectionVariance } from "./deflection-variance.js";

test("MemoryDeflectionVarianceStore finds what it saved", () => {
  const store = newMemoryDeflectionVarianceStore();
  const item = newDeflectionVariance("code-194", "name-438");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
