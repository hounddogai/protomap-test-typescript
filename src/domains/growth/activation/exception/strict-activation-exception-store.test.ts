import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictActivationExceptionStore } from "./strict-activation-exception-store.js";
import { newStrictActivationException } from "./strict-activation-exception.js";

test("MemoryStrictActivationExceptionStore finds what it saved", () => {
  const store = newMemoryStrictActivationExceptionStore();
  const item = newStrictActivationException("code-594", "name-517");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
