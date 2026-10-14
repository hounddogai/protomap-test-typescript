import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInVarianceStore } from "./double-opt-in-variance-store.js";
import { newDoubleOptInVariance } from "./double-opt-in-variance.js";

test("MemoryDoubleOptInVarianceStore finds what it saved", () => {
  const store = newMemoryDoubleOptInVarianceStore();
  const item = newDoubleOptInVariance("code-910", "title-565");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
