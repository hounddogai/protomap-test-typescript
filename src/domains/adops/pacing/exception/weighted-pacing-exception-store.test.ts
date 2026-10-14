import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPacingExceptionStore } from "./weighted-pacing-exception-store.js";
import { newWeightedPacingException } from "./weighted-pacing-exception.js";

test("MemoryWeightedPacingExceptionStore finds what it saved", () => {
  const store = newMemoryWeightedPacingExceptionStore();
  const item = newWeightedPacingException("code-374", "name-368");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
