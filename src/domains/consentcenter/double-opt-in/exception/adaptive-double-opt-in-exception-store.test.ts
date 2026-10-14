import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveDoubleOptInExceptionStore } from "./adaptive-double-opt-in-exception-store.js";
import { newAdaptiveDoubleOptInException } from "./adaptive-double-opt-in-exception.js";

test("MemoryAdaptiveDoubleOptInExceptionStore finds what it saved", () => {
  const store = newMemoryAdaptiveDoubleOptInExceptionStore();
  const item = newAdaptiveDoubleOptInException("code-509", "name-921");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
