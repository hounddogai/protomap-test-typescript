import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedFrequencyExceptionStore } from "./weighted-frequency-exception-store.js";
import { newWeightedFrequencyException } from "./weighted-frequency-exception.js";

test("MemoryWeightedFrequencyExceptionStore finds what it saved", () => {
  const store = newMemoryWeightedFrequencyExceptionStore();
  const item = newWeightedFrequencyException("code-919", "label-712");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
