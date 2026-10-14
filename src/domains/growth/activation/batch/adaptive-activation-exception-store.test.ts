import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveActivationExceptionStore } from "./adaptive-activation-exception-store.js";
import { newAdaptiveActivationException } from "./adaptive-activation-exception.js";

test("MemoryAdaptiveActivationExceptionStore finds what it saved", () => {
  const store = newMemoryAdaptiveActivationExceptionStore();
  const item = newAdaptiveActivationException("code-781", "label-767");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
