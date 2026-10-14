import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionThresholdStore } from "./conversion-threshold-store.js";
import { newConversionThreshold } from "./conversion-threshold.js";

test("MemoryConversionThresholdStore finds what it saved", () => {
  const store = newMemoryConversionThresholdStore();
  const item = newConversionThreshold("code-306", "title-868");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
